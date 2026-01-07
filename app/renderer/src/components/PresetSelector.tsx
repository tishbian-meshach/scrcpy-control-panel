import {
    HiLightningBolt,
    HiMusicNote,
    HiEye,
    HiTerminal,
    HiAdjustments
} from 'react-icons/hi'

interface Preset {
    id: string
    name: string
    description: string
    icon: React.ReactNode
}

interface PresetSelectorProps {
    selectedPreset: string | null
    onSelect: (presetId: string) => void
}

const PRESETS: Preset[] = [
    {
        id: 'low-latency',
        name: 'Low Latency',
        description: 'Fast response, no audio',
        icon: <HiLightningBolt />
    },
    {
        id: 'audio-only',
        name: 'Audio Only',
        description: 'Stream audio, no video',
        icon: <HiMusicNote />
    },
    {
        id: 'mirror-only',
        name: 'Mirror Only',
        description: 'View-only, no controls',
        icon: <HiEye />
    },
    {
        id: 'full-control',
        name: 'Full Control',
        description: 'All features enabled',
        icon: <HiTerminal />
    },
    {
        id: 'custom',
        name: 'Custom',
        description: 'Manual settings active',
        icon: <HiAdjustments />
    }
]

function PresetSelector({ selectedPreset, onSelect }: PresetSelectorProps) {
    return (
        <div className="preset-grid">
            {PRESETS.map((preset) => (
                <div
                    key={preset.id}
                    className={`preset-card ${selectedPreset === preset.id ? 'preset-card--selected' : ''}`}
                    onClick={() => onSelect(preset.id)}
                >
                    <div className="preset-card__icon">
                        {preset.icon}
                    </div>
                    <div className="preset-card__name">{preset.name}</div>
                    <div className="preset-card__description">{preset.description}</div>
                </div>
            ))}
        </div>
    )
}

export default PresetSelector
