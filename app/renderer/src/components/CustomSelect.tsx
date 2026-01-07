import { useState, useRef, useEffect } from 'react'
import { HiChevronDown } from 'react-icons/hi'

interface Option {
    value: string | number
    label: string
}

interface CustomSelectProps {
    options: Option[]
    value: string | number
    onChange: (value: any) => void
    placeholder?: string
    disabled?: boolean
}

function CustomSelect({ options, value, onChange, placeholder = 'Select...', disabled = false }: CustomSelectProps) {
    const [isOpen, setIsOpen] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    const selectedOption = options.find(opt => opt.value === value)

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleToggle = () => {
        if (!disabled) {
            setIsOpen(!isOpen)
        }
    }

    const handleSelect = (optionValue: any) => {
        onChange(optionValue)
        setIsOpen(false)
    }

    return (
        <div className={`custom-select ${isOpen ? 'custom-select--open' : ''}`} ref={containerRef}>
            <div
                className="custom-select__trigger"
                onClick={handleToggle}
                style={{ opacity: disabled ? 0.5 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}
            >
                {selectedOption ? (
                    <span>{selectedOption.label}</span>
                ) : (
                    <span className="custom-select__placeholder">{placeholder}</span>
                )}
                <HiChevronDown className="custom-select__icon" />
            </div>

            {isOpen && (
                <div className="custom-select__dropdown">
                    {options.map((option) => (
                        <div
                            key={option.value}
                            className={`custom-select__option ${option.value === value ? 'custom-select__option--selected' : ''}`}
                            onClick={() => handleSelect(option.value)}
                        >
                            {option.label}
                        </div>
                    ))}
                    {options.length === 0 && (
                        <div className="custom-select__option" style={{ pointerEvents: 'none', color: 'var(--text-tertiary)' }}>
                            No options available
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

export default CustomSelect
