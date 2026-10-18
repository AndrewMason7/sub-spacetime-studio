import os
import wave
import numpy as np

os.makedirs("/home/claw/sub-spacetime-studio/public/audio", exist_ok=True)
SR = 44100

def save_stereo_wav(filepath, left, right):
    # Normalize safely with soft limiting
    peak = max(np.max(np.abs(left)), np.max(np.abs(right)), 1e-6)
    if peak > 0.92:
        left = left * (0.92 / peak)
        right = right * (0.92 / peak)
    stereo = np.empty((len(left) * 2,), dtype=np.int16)
    stereo[0::2] = np.clip(left * 32767, -32767, 32767).astype(np.int16)
    stereo[1::2] = np.clip(right * 32767, -32767, 32767).astype(np.int16)
    with wave.open(filepath, "wb") as wf:
        wf.setnchannels(2)
        wf.setsampwidth(2)
        wf.setframerate(SR)
        wf.writeframes(stereo.tobytes())
    print(f"Saved {filepath} ({os.path.getsize(filepath) / 1024:.1f} KB)")

def apply_lush_stereo_reverb(left, right, decay=2.8):
    # True Stereo Convolution Reverb using dark velvet filtered noise IR
    ir_len = int(SR * 3.2)
    t_ir = np.linspace(0, 3.2, ir_len, endpoint=False)
    env = np.exp(-t_ir * decay) * (1.0 - np.exp(-t_ir * 18.0))
    rng = np.random.default_rng(42)
    noise_l = rng.standard_normal(ir_len) * env
    noise_r = rng.standard_normal(ir_len) * env
    # Warm lowpass filter on reverb impulse response (one-pole IIR)
    alpha = 0.08
    for i in range(1, ir_len):
        noise_l[i] = (1 - alpha) * noise_l[i - 1] + alpha * noise_l[i]
        noise_r[i] = (1 - alpha) * noise_r[i - 1] + alpha * noise_r[i]
    # FFT convolution for circular seamless loop!
    n = len(left)
    wet_l = np.fft.irfft(np.fft.rfft(left, n) * np.fft.rfft(noise_l, n), n) * 0.032
    wet_r = np.fft.irfft(np.fft.rfft(right, n) * np.fft.rfft(noise_r, n), n) * 0.032
    return left * 0.62 + wet_l * 0.55, right * 0.62 + wet_r * 0.55

def synth_warm_pad_swell(freqs, duration, sr=SR):
    n = int(duration * sr)
    t = np.linspace(0, duration, n, endpoint=False)
    # Breathing swell envelope: rises gently over 2.2s, then decays smoothly to near-silence (NEVER a flat straight tone!)
    env = np.sin(np.pi * (t / duration)) ** 1.6 * np.exp(-0.25 * (t / duration))
    left = np.zeros(n)
    right = np.zeros(n)
    rng = np.random.default_rng(101)
    for idx, f in enumerate(freqs):
        # 5-voice unison chorus per chord note with slow organic vibrato (CS-80 style)
        for detune_cents, pan in [(-9.0, 0.2), (-3.5, 0.35), (0.0, 0.5), (4.0, 0.65), (9.5, 0.8)]:
            f_det = f * (2.0 ** (detune_cents / 1200.0))
            ph0 = rng.uniform(0, 2 * np.pi)
            vib = 0.0012 * np.sin(2 * np.pi * (0.35 + 0.07 * idx) * t + ph0)
            phase = 2 * np.pi * f_det * t + vib
            # Warm soft-filtered analog waveform (fundamental + gentle 2nd & 3rd harmonics that fade over the note)
            harm_env = np.exp(-t * 0.45)
            wave_sig = (
                np.sin(phase) * 0.72
                + np.sin(2 * phase + 0.4) * 0.20 * harm_env
                + np.sin(3 * phase + 1.1) * 0.08 * (harm_env ** 1.5)
            )
            weight = 0.055 / (1.0 + idx * 0.22)
            left += wave_sig * weight * (1.0 - pan) * env
            right += wave_sig * weight * pan * env
    return left, right

def synth_felt_piano_note(freq, duration, pan=0.5, sr=SR):
    n = int(duration * sr)
    t = np.linspace(0, duration, n, endpoint=False)
    # Soft felt hammer attack (25ms) + natural piano string decay
    attack = 1.0 - np.exp(-t / 0.022)
    decay1 = np.exp(-t * 1.65)
    decay2 = np.exp(-t * 4.2)
    # Slight inharmonicity of real piano strings + twin unison strings (+1.8 cents)
    f2 = freq * (2.0 ** (1.8 / 1200.0))
    sig = (
        (np.sin(2 * np.pi * freq * t) + np.sin(2 * np.pi * f2 * t)) * 0.45 * decay1
        + np.sin(2 * np.pi * freq * 2.0005 * t + 0.3) * 0.16 * decay2
        + np.sin(2 * np.pi * freq * 3.0015 * t + 0.8) * 0.05 * (decay2 ** 1.6)
    ) * attack * 0.24
    return sig * (1.0 - pan), sig * pan

# ==============================================================================
# 1. BUILD 24-SECOND CINEMATIC SPACE SOUNDTRACK (4-CHORD PROGRESSION + FELT PIANO)
#    Chords:
#      0s -  6s: Fmaj9(#11)  [F2, C3, E3, G3, A3, B3]
#      6s - 12s: G6(add9)    [G2, D3, E3, A3, B3, D4]
#     12s - 18s: Am9         [A2, E3, G3, B3, C4, E4]
#     18s - 24s: Em7(add11)  [E2, B2, D3, G3, A3, B3]
# ==============================================================================
total_dur = 24.0
total_samples = int(total_dur * SR)
track_l = np.zeros(total_samples)
track_r = np.zeros(total_samples)

chords = [
    # (start_sec, chord_freqs, arpeggio_melody_notes)
    (0.0,  [87.31, 130.81, 164.81, 196.00, 220.00, 246.94], [(0.4, 329.63, 0.3), (1.9, 392.00, 0.7), (3.4, 493.88, 0.35), (4.6, 440.00, 0.65)]),
    (6.0,  [98.00, 146.83, 164.81, 220.00, 246.94, 293.66], [(6.4, 392.00, 0.65), (7.9, 440.00, 0.3), (9.4, 587.33, 0.7), (10.6, 493.88, 0.4)]),
    (12.0, [110.00, 164.81, 196.00, 246.94, 261.63, 329.63], [(12.4, 440.00, 0.3), (13.9, 523.25, 0.7), (15.4, 659.25, 0.35), (16.6, 493.88, 0.65)]),
    (18.0, [82.41, 123.47, 146.83, 196.00, 220.00, 246.94], [(18.4, 329.63, 0.65), (19.9, 392.00, 0.35), (21.4, 493.88, 0.65), (22.6, 440.00, 0.4)])
]

# Overlapping 7.2s pad swells (crossfading across chord boundaries with circular wrap)
for start_s, c_freqs, arp_notes in chords:
    pad_l, pad_r = synth_warm_pad_swell(c_freqs, 7.2)
    start_idx = int(start_s * SR)
    for i in range(len(pad_l)):
        idx = (start_idx + i) % total_samples
        track_l[idx] += pad_l[i]
        track_r[idx] += pad_r[i]

    for note_t, note_f, pan in arp_notes:
        p_l, p_r = synth_felt_piano_note(note_f, 3.8, pan=pan)
        n_idx = int(note_t * SR)
        for i in range(len(p_l)):
            idx = (n_idx + i) % total_samples
            track_l[idx] += p_l[i]
            track_r[idx] += p_r[i]

track_l, track_r = apply_lush_stereo_reverb(track_l, track_r, decay=2.2)
save_stereo_wav("/home/claw/sub-spacetime-studio/public/audio/cosmic_soundtrack.wav", track_l, track_r)

# ==============================================================================
# 2. BUILD NATURAL FELT-PIANO &WARM CHORD TRANSITION SWELLS (FOR SCENE SWITCH)
# ==============================================================================
for name, chord_f, arp_f in [
    ("swell_ignition.wav", [146.83, 220.00, 293.66, 369.99, 440.00], [293.66, 369.99, 440.00, 587.33]),
    ("swell_phase.wav",    [130.81, 196.00, 246.94, 293.66, 392.00], [261.63, 329.63, 392.00, 493.88]),
    ("swell_shatter.wav",  [110.00, 164.81, 220.00, 261.63, 329.63], [220.00, 261.63, 329.63, 440.00]),
]:
    dur = 3.2
    ns = int(dur * SR)
    sl, sr_ch = synth_warm_pad_swell(chord_f, dur)
    for k, af in enumerate(arp_f):
        pl, pr = synth_felt_piano_note(af, 2.4, pan=0.25 + 0.16 * k)
        off = int(k * 0.11 * SR)
        for i in range(min(len(pl), ns - off)):
            sl[off + i] += pl[i] * 0.75
            sr_ch[off + i] += pr[i] * 0.75
    sl, sr_ch = apply_lush_stereo_reverb(sl, sr_ch, decay=2.8)
    # Smooth fade-out at end of one-shot buffer
    fade = np.linspace(1.0, 0.0, int(0.4 * SR))
    sl[-len(fade):] *= fade
    sr_ch[-len(fade):] *= fade
    save_stereo_wav(f"/home/claw/sub-spacetime-studio/public/audio/{name}", sl, sr_ch)
