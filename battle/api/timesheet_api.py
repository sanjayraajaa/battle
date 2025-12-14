import frappe
from frappe import _
from frappe.utils import getdate, add_days, get_datetime, flt
import json


@frappe.whitelist()
def get_weekly_timesheet(start_date, end_date):
    """
    Fetch weekly timesheet data for the logged-in user.
    Returns existing Timesheet (if any) and grouped rows for the grid.
    """
    start_date = getdate(start_date)
    end_date = getdate(end_date)

    # Get Employee linked to User
    employee = frappe.db.get_value("Employee", {"user_id": frappe.session.user}, "name")
    if not employee:
        frappe.throw(_("No Employee found for current user"))

    # Find existing Timesheet for this period
    # We look for a timesheet that exactly matches the start/end date
    # OR overlaps significantly. For Option A, we assume strict weekly timesheets.
    timesheet_name = frappe.db.get_value(
        "Timesheet",
        {
            "employee": employee,
            "start_date": start_date,
            "end_date": end_date,
            "docstatus": ["!=", 2],  # Not cancelled
        },
        "name",
    )

    timesheet_doc = None
    logs = []

    if timesheet_name:
        timesheet_doc = frappe.get_doc("Timesheet", timesheet_name)
        logs = timesheet_doc.time_logs

    # Group logs by Project + Task + Activity + Description
    # We want to return a structure that the frontend can easily map to rows
    # key: (project, task, activity_type, description) -> { date: hours }
    grouped_data = {}

    for log in logs:
        key = (log.project, log.task, log.activity_type, log.description)
        if key not in grouped_data:
            grouped_data[key] = {
                "project": log.project,
                "task": log.task,
                "activity_type": log.activity_type,
                "description": log.description or "",
                "hours_by_date": {},
            }

        # Extract date from from_time
        log_date = getdate(log.from_time).strftime("%Y-%m-%d")

        # Add hours (accumulate if multiple entries for same day/activity exist, though UI usually prevents this)
        current_hours = grouped_data[key]["hours_by_date"].get(log_date, 0.0)
        grouped_data[key]["hours_by_date"][log_date] = current_hours + flt(log.hours)

    return {
        "timesheet_name": timesheet_name,
        "status": timesheet_doc.status if timesheet_doc else None,
        "docstatus": timesheet_doc.docstatus if timesheet_doc else 0,
        "rows": list(grouped_data.values()),
    }


@frappe.whitelist()
def save_weekly_timesheet(data):
    """
    Save weekly timesheet.
    data = {
        "week_start": "2025-08-11",
        "week_end": "2025-08-17",
        "rows": [...]
    }
    """
    if isinstance(data, str):
        data = json.loads(data)

    week_start = getdate(data.get("week_start"))
    week_end = getdate(data.get("week_end"))
    rows = data.get("rows", [])
    action = data.get("action", "Save")  # Save or Submit

    employee = frappe.db.get_value("Employee", {"user_id": frappe.session.user}, "name")
    if not employee:
        frappe.throw(_("No Employee found for current user"))

    # Find existing Timesheet
    timesheet_name = frappe.db.get_value(
        "Timesheet",
        {
            "employee": employee,
            "start_date": week_start,
            "end_date": week_end,
            "docstatus": ["!=", 2],
        },
        "name",
    )

    if timesheet_name:
        ts = frappe.get_doc("Timesheet", timesheet_name)
    else:
        ts = frappe.new_doc("Timesheet")
        ts.employee = employee
        ts.start_date = week_start
        ts.end_date = week_end

    if ts.docstatus == 1:
        frappe.throw(_("This Timesheet is already submitted."))

    # Clear existing logs and recreate them
    # This ensures exact sync with the grid
    ts.set("time_logs", [])

    for row in rows:
        project = row.get("project")
        task = row.get("task")
        activity_type = row.get("activity_type")
        description = row.get("description")
        hours_by_date = row.get("hours_by_date", {})

        if not activity_type:
            continue

        for date_str, hours in hours_by_date.items():
            hours = flt(hours)
            if hours <= 0:
                continue

            # Create a log entry
            # Default start time 09:00:00
            log_date = getdate(date_str)
            from_time_str = f"{log_date} 09:00:00"

            # Calculate to_time based on hours
            # We use frappe.utils.add_to_date doesn't support fractional hours nicely for datetime directly?
            # Easier to do timestamp math or just let ERPNext handle it if we only set hours?
            # Timesheet Detail requires from_time and to_time usually to calc hours, OR we set hours and from_time.
            # Let's set from_time and convert hours to seconds.

            from_time_dt = get_datetime(from_time_str)
            # hours * 3600 = seconds
            # to_time = from_time + seconds
            to_time_dt = from_time_dt + import_timedelta(hours=hours)

            ts.append(
                "time_logs",
                {
                    "activity_type": activity_type,
                    "project": project,
                    "task": task,
                    "description": description,
                    "from_time": from_time_dt,
                    "to_time": to_time_dt,
                    "hours": hours,
                    "is_billable": 0,  # Default, or fetch from Activity Type if needed
                },
            )

    ts.save()

    if action == "Submit":
        ts.submit()

    return {"timesheet_name": ts.name, "status": ts.status, "docstatus": ts.docstatus}


def import_timedelta(**kwargs):
    from datetime import timedelta

    return timedelta(**kwargs)
