import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { Check, Paintbrush } from "lucide-react"
import { useMemo, useState } from "react"

interface ColorPickerProps {
    value?: string
    onChange: (value: string) => void
    className?: string
}

export function ColorPicker({ value, onChange, className }: ColorPickerProps) {
    const [open, setOpen] = useState(false)

    const solids = useMemo(() => [
        '#E2E2E2', '#ff75c3', '#ffa647', '#ffe83f', '#9fff5b', '#70e2ff', '#cd93ff', '#09203f',
        '#ff4d4d', '#ffaf40', '#fffa65', '#32ff7e', '#18dcff', '#7d5fff',
        '#ef5777', '#f53b57', '#0fb9b1', '#0be881', '#34e7e4', '#00d2d3',
        '#546de5', '#778beb', '#e15f41', '#f19066', '#f3a683', '#f7d794',
        '#f8a5c2', '#f78fb3', '#786fa6', '#63cdda', '#ea8685', '#596275',
        '#574b90', '#303952', '#e66767', '#3dc1d3',
    ], [])

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className={cn(
                        "w-full justify-start text-left font-normal",
                        !value && "text-muted-foreground",
                        className
                    )}
                >
                    <div className="w-full flex items-center gap-2">
                        {value ? (
                            <div
                                className="h-4 w-4 rounded !bg-center !bg-cover transition-all"
                                style={{ background: value }}
                            />
                        ) : (
                            <Paintbrush className="h-4 w-4" />
                        )}
                        <div className="truncate flex-1">
                            {value ? value : "Pick a color"}
                        </div>
                    </div>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64">
                <div className="flex flex-wrap gap-1 mb-4">
                    {solids.map((s) => (
                        <div
                            key={s}
                            style={{ background: s }}
                            className="rounded-md h-6 w-6 cursor-pointer active:scale-105 hover:scale-110 hover:shadow-md transition-all flex items-center justify-center p-0.5 border border-muted"
                            onClick={() => {
                                onChange(s)
                                setOpen(false)
                            }}
                        >
                            {value === s && (
                                <Check className="h-3 w-3 text-white mix-blend-difference" />
                            )}
                        </div>
                    ))}
                </div>
                <Input
                    id="custom"
                    value={value}
                    className="col-span-2 h-8 mt-2"
                    onChange={(e) => onChange(e.currentTarget.value)}
                    placeholder="#000000"
                />
            </PopoverContent>
        </Popover>
    )
}
