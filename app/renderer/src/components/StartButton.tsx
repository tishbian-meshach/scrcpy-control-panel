import { HiPlay, HiStop } from 'react-icons/hi'

interface StartButtonProps {
    isRunning: boolean
    isLoading: boolean
    disabled: boolean
    onStart: () => void
    onStop: () => void
}

function StartButton({ isRunning, isLoading, disabled, onStart, onStop }: StartButtonProps) {
    if (isRunning) {
        return (
            <button
                className="start-button start-button--running"
                onClick={onStop}
                disabled={disabled || isLoading}
            >
                {isLoading ? (
                    <span className="spinner" style={{ width: 32, height: 32, borderTopColor: 'white' }}></span>
                ) : (
                    <>
                        <HiStop className="start-button__icon" />
                        <span>STOP</span>
                    </>
                )}
            </button>
        )
    }

    return (
        <button
            className="start-button"
            onClick={onStart}
            disabled={disabled || isLoading}
        >
            {isLoading ? (
                <span className="spinner" style={{ width: 32, height: 32, borderTopColor: 'white' }}></span>
            ) : (
                <>
                    <HiPlay className="start-button__icon" />
                    <span>START</span>
                </>
            )}
        </button>
    )
}

export default StartButton
