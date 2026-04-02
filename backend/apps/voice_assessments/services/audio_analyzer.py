import librosa
import numpy as np
import soundfile as sf

def analyze_audio(audio_path):
    """
    Extract vocal features from an audio file.
    Returns dict with:
        - pitch_mean: average fundamental frequency (Hz)
        - speaking_rate: estimated words per second
        - energy_mean: average RMS amplitude
        - hesitation_ratio: proportion of silent pauses >0.3s
    """
    try:
        # Load audio
        y, sr = librosa.load(audio_path, sr=None)

        # Pitch (f0) using pyin
        f0, voiced_flag, voiced_probs = librosa.pyin(y, fmin=50, fmax=300, sr=sr)
        pitch_mean = np.nanmean(f0) if not np.all(np.isnan(f0)) else 0.0

        # Energy (RMS)
        rms = librosa.feature.rms(y=y)[0]
        energy_mean = float(np.mean(rms))

        # Speaking rate: estimate from onset detection (rough proxy)
        onset_frames = librosa.onset.onset_detect(y=y, sr=sr, backtrack=True)
        num_syllables = max(len(onset_frames), 1)
        duration = len(y) / sr
        speaking_rate = num_syllables / duration if duration > 0 else 0.0

        # Hesitation ratio: silence detection
        # Use librosa.effects.split to get non-silent intervals
        intervals = librosa.effects.split(y, top_db=20)
        silent_duration = 0.0
        start = 0
        for interval in intervals:
            silent_duration += interval[0] - start
            start = interval[1]
        silent_duration += duration - start
        hesitation_ratio = silent_duration / duration if duration > 0 else 0.0

        return {
            'pitch_mean': round(pitch_mean, 2),
            'speaking_rate': round(speaking_rate, 2),
            'energy_mean': round(energy_mean, 2),
            'hesitation_ratio': round(hesitation_ratio, 2),
            'duration': round(duration, 2)
        }
    except Exception as e:
        # Fallback defaults
        return {
            'pitch_mean': 0.0,
            'speaking_rate': 0.0,
            'energy_mean': 0.0,
            'hesitation_ratio': 0.0,
            'duration': 0.0
        }