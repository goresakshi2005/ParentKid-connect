import { FiMic, FiSquare, FiLoader } from 'react-icons/fi';

const VoiceRecorder = ({ onRecordingComplete, disabled = false }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [permissionDenied, setPermissionDenied] = useState(false);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const timerRef = useRef(null);

    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                mediaRecorderRef.current.stop();
            }
        };
    }, []);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                onRecordingComplete(audioBlob);
                stream.getTracks().forEach(track => track.stop());
                setRecordingTime(0);
                if (timerRef.current) clearInterval(timerRef.current);
            };

            mediaRecorder.start(1000);
            setIsRecording(true);
            setRecordingTime(0);
            timerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);
        } catch (err) {
            console.error('Microphone permission error:', err);
            setPermissionDenied(true);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const formatTime = (sec) => {
        const mins = Math.floor(sec / 60);
        const secs = sec % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="flex flex-col items-center gap-3">
            {permissionDenied && (
                <p className="text-red-500 text-sm">Microphone access denied. Please allow microphone and refresh.</p>
            )}
            <div className="flex gap-4">
                {!isRecording ? (
                    <button
                        onClick={startRecording}
                        disabled={disabled}
                        className="flex items-center gap-2 px-6 py-3 bg-pink-600 hover:bg-pink-700 disabled:opacity-50 text-white rounded-full font-bold shadow-lg transition-all"
                    >
                        <FiMic className="text-xl" /> Start Recording
                    </button>
                ) : (
                    <button
                        onClick={stopRecording}
                        className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-full font-bold shadow-lg transition-all animate-pulse"
                    >
                        <FiSquare className="text-xl" /> Stop Recording ({formatTime(recordingTime)})
                    </button>
                )}
            </div>
            {isRecording && (
                <div className="flex items-center gap-2 text-pink-500">
                    <FiLoader className="animate-spin" />
                    <span className="text-sm">Recording... speak clearly</span>
                </div>
            )}
        </div>
    );
};

export default VoiceRecorder;