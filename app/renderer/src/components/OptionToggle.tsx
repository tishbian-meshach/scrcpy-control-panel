interface OptionToggleProps {
    label: string
    description?: string
    enabled: boolean
    onChange: (enabled: boolean) => void
    disabled?: boolean
}

function OptionToggle({ label, description, enabled, onChange, disabled = false }: OptionToggleProps) {
    return (
        <div
            className={`toggle ${enabled ? 'toggle--active' : ''}`}
            onClick={() => !disabled && onChange(!enabled)}
            style={{
                opacity: disabled ? 0.5 : 1,
                cursor: disabled ? 'not-allowed' : 'pointer',
                pointerEvents: disabled ? 'none' : 'auto'
            }}
        >
            <div className="toggle__content">
                <div className="toggle__label">{label}</div>
                {description && <div className="toggle__description">{description}</div>}
            </div>
            <div className="toggle__switch"></div>
        </div>
    )
}

export default OptionToggle
