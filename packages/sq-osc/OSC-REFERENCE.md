# SQ OSC Reference

Auto-generated from the sq-osc bridge registry.

**GET**: send address with no arguments → bridge replies with current value.
**SET**: send address with argument(s) listed below.
**Feedback**: bridge broadcasts all changes automatically.

## Input channels 1–48

| Address | R/W | Arguments | Description |
|---------|-----|-----------|-------------|
| `/input/{n}/fader` | R/W | f `level` (0–1) | Fader level (0.0 = off, 1.0 = +10 dB) |
| `/input/{n}/fader/db` | R |  | Fader level in dB (read-only, query only) |
| `/input/{n}/mute` | R/W | i `muted` (0–1) | Mute state |
| `/input/{n}/pan` | R/W | f `pan` (-1–1) | Pan position (-1.0 = full left, 0 = centre, +1.0 = full right) |
| `/input/{n}/name` | R/W | s `name` | Channel name (max 6 characters) |
| `/input/{n}/gain` | R/W | f `db` dB (0–60) | Preamp gain |
| `/input/{n}/trim` | R/W | f `db` dB (-24–24) | Input trim |
| `/input/{n}/phantom` | R/W | i `on` (0–1) | 48V phantom power |
| `/input/{n}/pad` | R/W | i `on` (0–1) | -20 dB pad |
| `/input/{n}/polarity` | R/W | i `on` (0–1) | Phase/polarity invert |
| `/input/{n}/hpf/on` | R/W | i `on` (0–1) | High-pass filter on/off |
| `/input/{n}/hpf/freq` | R/W | f `hz` Hz (20–2000) | High-pass filter frequency |
| `/input/{n}/hpf/slope` | R/W | i `slope` dB/oct | High-pass filter slope |
| `/input/{n}/gate/on` | R/W | i `on` (0–1) | Gate on/off |
| `/input/{n}/gate/threshold` | R/W | f `db` dB (-128–0) | Gate threshold |
| `/input/{n}/gate/depth` | R/W | f `db` dB (0–60) | Gate depth (attenuation below threshold) |
| `/input/{n}/gate/attack` | R/W | f `ms` ms (0.05–300) | Gate attack time |
| `/input/{n}/gate/release` | R/W | f `ms` ms (10–1000) | Gate release time |
| `/input/{n}/gate/hold` | R/W | f `ms` ms (10–5000) | Gate hold time |
| `/input/{n}/comp/on` | R/W | i `on` (0–1) | Compressor on/off |
| `/input/{n}/comp/threshold` | R/W | f `db` dB (-46–18) | Compressor threshold |
| `/input/{n}/comp/ratio` | R/W | f `ratio` (1–undefined) | Compressor ratio (use 0 for ∞:1) |
| `/input/{n}/comp/gain` | R/W | f `db` dB (0–18) | Compressor makeup gain |
| `/input/{n}/delay/on` | R/W | i `on` (0–1) | Channel delay on/off |
| `/input/{n}/delay/time` | R/W | f `ms` ms (0–341) | Channel delay time |
| `/input/{n}/peq/on` | R/W | i `on` (0–1) | Parametric EQ on/off |
| `/input/{n}/peq/lf/gain` | R/W | f `db` dB (-46–18) | PEQ low-freq band gain |
| `/input/{n}/peq/lf/freq` | R/W | f `hz` Hz (20–20000) | PEQ low-freq band frequency |
| `/input/{n}/peq/lf/q` | R/W | f `q` | PEQ low-freq band Q factor |
| `/input/{n}/peq/lf/shape` | R/W | i `shape` | PEQ low-freq band shape (0=Peak, 6=Low Shelf, 11=High Pass) |
| `/input/{n}/peq/lm/gain` | R/W | f `db` dB (-46–18) | PEQ low-mid band gain |
| `/input/{n}/peq/lm/freq` | R/W | f `hz` Hz (20–20000) | PEQ low-mid band frequency |
| `/input/{n}/peq/lm/q` | R/W | f `q` | PEQ low-mid band Q factor |
| `/input/{n}/peq/hm/gain` | R/W | f `db` dB (-46–18) | PEQ high-mid band gain |
| `/input/{n}/peq/hm/freq` | R/W | f `hz` Hz (20–20000) | PEQ high-mid band frequency |
| `/input/{n}/peq/hm/q` | R/W | f `q` | PEQ high-mid band Q factor |
| `/input/{n}/peq/hf/gain` | R/W | f `db` dB (-46–18) | PEQ high-freq band gain |
| `/input/{n}/peq/hf/freq` | R/W | f `hz` Hz (20–20000) | PEQ high-freq band frequency |
| `/input/{n}/peq/hf/q` | R/W | f `q` | PEQ high-freq band Q factor |
| `/input/{n}/peq/hf/shape` | R/W | i `shape` | PEQ high-freq band shape (0=Peak, 6=Low Shelf, 11=High Pass) |
| `/input/{n}/send/1` | R/W | f `level` (0–1) | Send level to mix bus 1 |
| `/input/{n}/send/2` | R/W | f `level` (0–1) | Send level to mix bus 2 |
| `/input/{n}/send/3` | R/W | f `level` (0–1) | Send level to mix bus 3 |
| `/input/{n}/send/4` | R/W | f `level` (0–1) | Send level to mix bus 4 |
| `/input/{n}/send/5` | R/W | f `level` (0–1) | Send level to mix bus 5 |
| `/input/{n}/send/6` | R/W | f `level` (0–1) | Send level to mix bus 6 |
| `/input/{n}/send/7` | R/W | f `level` (0–1) | Send level to mix bus 7 |
| `/input/{n}/send/8` | R/W | f `level` (0–1) | Send level to mix bus 8 |
| `/input/{n}/send/9` | R/W | f `level` (0–1) | Send level to mix bus 9 |
| `/input/{n}/send/10` | R/W | f `level` (0–1) | Send level to mix bus 10 |
| `/input/{n}/send/11` | R/W | f `level` (0–1) | Send level to mix bus 11 |
| `/input/{n}/send/12` | R/W | f `level` (0–1) | Send level to mix bus 12 |
| `/input/{n}/sendfx/1` | R/W | f `level` (0–1) | Send level to FX return 1 |
| `/input/{n}/sendfx/2` | R/W | f `level` (0–1) | Send level to FX return 2 |
| `/input/{n}/sendfx/3` | R/W | f `level` (0–1) | Send level to FX return 3 |
| `/input/{n}/sendfx/4` | R/W | f `level` (0–1) | Send level to FX return 4 |
| `/input/{n}/insert` | R/W | i `on` (0–1) | Insert enabled |
| `/input/{n}/directout` | R/W | i `out` (0–3) | Direct output assignment (0 = none, 1–3 = output number) |
| `/input/{n}/pafl` | R/W | i `on` (0–1) | PAFL (solo) on/off |
| `/input/{n}/color` | W | i `r` (0–255), i `g` (0–255), i `b` (0–255) | Channel colour (send 0 0 0 for transparent) |

## Stereo inputs 1–3

| Address | R/W | Arguments | Description |
|---------|-----|-----------|-------------|
| `/stereo/{n}/fader` | R/W | f `level` (0–1) | Fader level (0.0 = off, 1.0 = +10 dB) |
| `/stereo/{n}/fader/db` | R |  | Fader level in dB (read-only, query only) |
| `/stereo/{n}/mute` | R/W | i `muted` (0–1) | Mute state |
| `/stereo/{n}/pan` | R/W | f `pan` (-1–1) | Pan position (-1.0 = full left, 0 = centre, +1.0 = full right) |
| `/stereo/{n}/name` | R/W | s `name` | Channel name (max 6 characters) |
| `/stereo/{n}/gain` | R/W | f `db` dB (0–60) | Preamp gain |
| `/stereo/{n}/trim` | R/W | f `db` dB (-24–24) | Input trim |
| `/stereo/{n}/phantom` | R/W | i `on` (0–1) | 48V phantom power |
| `/stereo/{n}/pad` | R/W | i `on` (0–1) | -20 dB pad |
| `/stereo/{n}/polarity` | R/W | i `on` (0–1) | Phase/polarity invert |
| `/stereo/{n}/hpf/on` | R/W | i `on` (0–1) | High-pass filter on/off |
| `/stereo/{n}/hpf/freq` | R/W | f `hz` Hz (20–2000) | High-pass filter frequency |
| `/stereo/{n}/hpf/slope` | R/W | i `slope` dB/oct | High-pass filter slope |
| `/stereo/{n}/gate/on` | R/W | i `on` (0–1) | Gate on/off |
| `/stereo/{n}/gate/threshold` | R/W | f `db` dB (-128–0) | Gate threshold |
| `/stereo/{n}/gate/depth` | R/W | f `db` dB (0–60) | Gate depth (attenuation below threshold) |
| `/stereo/{n}/gate/attack` | R/W | f `ms` ms (0.05–300) | Gate attack time |
| `/stereo/{n}/gate/release` | R/W | f `ms` ms (10–1000) | Gate release time |
| `/stereo/{n}/gate/hold` | R/W | f `ms` ms (10–5000) | Gate hold time |
| `/stereo/{n}/comp/on` | R/W | i `on` (0–1) | Compressor on/off |
| `/stereo/{n}/comp/threshold` | R/W | f `db` dB (-46–18) | Compressor threshold |
| `/stereo/{n}/comp/ratio` | R/W | f `ratio` (1–undefined) | Compressor ratio (use 0 for ∞:1) |
| `/stereo/{n}/comp/gain` | R/W | f `db` dB (0–18) | Compressor makeup gain |
| `/stereo/{n}/delay/on` | R/W | i `on` (0–1) | Channel delay on/off |
| `/stereo/{n}/delay/time` | R/W | f `ms` ms (0–341) | Channel delay time |
| `/stereo/{n}/peq/on` | R/W | i `on` (0–1) | Parametric EQ on/off |
| `/stereo/{n}/peq/lf/gain` | R/W | f `db` dB (-46–18) | PEQ low-freq band gain |
| `/stereo/{n}/peq/lf/freq` | R/W | f `hz` Hz (20–20000) | PEQ low-freq band frequency |
| `/stereo/{n}/peq/lf/q` | R/W | f `q` | PEQ low-freq band Q factor |
| `/stereo/{n}/peq/lf/shape` | R/W | i `shape` | PEQ low-freq band shape (0=Peak, 6=Low Shelf, 11=High Pass) |
| `/stereo/{n}/peq/lm/gain` | R/W | f `db` dB (-46–18) | PEQ low-mid band gain |
| `/stereo/{n}/peq/lm/freq` | R/W | f `hz` Hz (20–20000) | PEQ low-mid band frequency |
| `/stereo/{n}/peq/lm/q` | R/W | f `q` | PEQ low-mid band Q factor |
| `/stereo/{n}/peq/hm/gain` | R/W | f `db` dB (-46–18) | PEQ high-mid band gain |
| `/stereo/{n}/peq/hm/freq` | R/W | f `hz` Hz (20–20000) | PEQ high-mid band frequency |
| `/stereo/{n}/peq/hm/q` | R/W | f `q` | PEQ high-mid band Q factor |
| `/stereo/{n}/peq/hf/gain` | R/W | f `db` dB (-46–18) | PEQ high-freq band gain |
| `/stereo/{n}/peq/hf/freq` | R/W | f `hz` Hz (20–20000) | PEQ high-freq band frequency |
| `/stereo/{n}/peq/hf/q` | R/W | f `q` | PEQ high-freq band Q factor |
| `/stereo/{n}/peq/hf/shape` | R/W | i `shape` | PEQ high-freq band shape (0=Peak, 6=Low Shelf, 11=High Pass) |
| `/stereo/{n}/send/1` | R/W | f `level` (0–1) | Send level to mix bus 1 |
| `/stereo/{n}/send/2` | R/W | f `level` (0–1) | Send level to mix bus 2 |
| `/stereo/{n}/send/3` | R/W | f `level` (0–1) | Send level to mix bus 3 |
| `/stereo/{n}/send/4` | R/W | f `level` (0–1) | Send level to mix bus 4 |
| `/stereo/{n}/send/5` | R/W | f `level` (0–1) | Send level to mix bus 5 |
| `/stereo/{n}/send/6` | R/W | f `level` (0–1) | Send level to mix bus 6 |
| `/stereo/{n}/send/7` | R/W | f `level` (0–1) | Send level to mix bus 7 |
| `/stereo/{n}/send/8` | R/W | f `level` (0–1) | Send level to mix bus 8 |
| `/stereo/{n}/send/9` | R/W | f `level` (0–1) | Send level to mix bus 9 |
| `/stereo/{n}/send/10` | R/W | f `level` (0–1) | Send level to mix bus 10 |
| `/stereo/{n}/send/11` | R/W | f `level` (0–1) | Send level to mix bus 11 |
| `/stereo/{n}/send/12` | R/W | f `level` (0–1) | Send level to mix bus 12 |
| `/stereo/{n}/sendfx/1` | R/W | f `level` (0–1) | Send level to FX return 1 |
| `/stereo/{n}/sendfx/2` | R/W | f `level` (0–1) | Send level to FX return 2 |
| `/stereo/{n}/sendfx/3` | R/W | f `level` (0–1) | Send level to FX return 3 |
| `/stereo/{n}/sendfx/4` | R/W | f `level` (0–1) | Send level to FX return 4 |
| `/stereo/{n}/insert` | R/W | i `on` (0–1) | Insert enabled |
| `/stereo/{n}/directout` | R/W | i `out` (0–3) | Direct output assignment (0 = none, 1–3 = output number) |
| `/stereo/{n}/pafl` | R/W | i `on` (0–1) | PAFL (solo) on/off |
| `/stereo/{n}/color` | W | i `r` (0–255), i `g` (0–255), i `b` (0–255) | Channel colour (send 0 0 0 for transparent) |

## FX returns 1–4

| Address | R/W | Arguments | Description |
|---------|-----|-----------|-------------|
| `/fxreturn/{n}/fader` | R/W | f `level` (0–1) | Fader level (0.0 = off, 1.0 = +10 dB) |
| `/fxreturn/{n}/fader/db` | R |  | Fader level in dB (read-only, query only) |
| `/fxreturn/{n}/mute` | R/W | i `muted` (0–1) | Mute state |
| `/fxreturn/{n}/pan` | R/W | f `pan` (-1–1) | Pan position (-1.0 = full left, 0 = centre, +1.0 = full right) |
| `/fxreturn/{n}/name` | R/W | s `name` | Channel name (max 6 characters) |
| `/fxreturn/{n}/comp/on` | R/W | i `on` (0–1) | Compressor on/off |
| `/fxreturn/{n}/comp/threshold` | R/W | f `db` dB (-46–18) | Compressor threshold |
| `/fxreturn/{n}/comp/ratio` | R/W | f `ratio` (1–undefined) | Compressor ratio (use 0 for ∞:1) |
| `/fxreturn/{n}/comp/gain` | R/W | f `db` dB (0–18) | Compressor makeup gain |
| `/fxreturn/{n}/peq/on` | R/W | i `on` (0–1) | Parametric EQ on/off |
| `/fxreturn/{n}/peq/lf/gain` | R/W | f `db` dB (-46–18) | PEQ low-freq band gain |
| `/fxreturn/{n}/peq/lf/freq` | R/W | f `hz` Hz (20–20000) | PEQ low-freq band frequency |
| `/fxreturn/{n}/peq/lf/q` | R/W | f `q` | PEQ low-freq band Q factor |
| `/fxreturn/{n}/peq/lf/shape` | R/W | i `shape` | PEQ low-freq band shape (0=Peak, 6=Low Shelf, 11=High Pass) |
| `/fxreturn/{n}/peq/lm/gain` | R/W | f `db` dB (-46–18) | PEQ low-mid band gain |
| `/fxreturn/{n}/peq/lm/freq` | R/W | f `hz` Hz (20–20000) | PEQ low-mid band frequency |
| `/fxreturn/{n}/peq/lm/q` | R/W | f `q` | PEQ low-mid band Q factor |
| `/fxreturn/{n}/peq/hm/gain` | R/W | f `db` dB (-46–18) | PEQ high-mid band gain |
| `/fxreturn/{n}/peq/hm/freq` | R/W | f `hz` Hz (20–20000) | PEQ high-mid band frequency |
| `/fxreturn/{n}/peq/hm/q` | R/W | f `q` | PEQ high-mid band Q factor |
| `/fxreturn/{n}/peq/hf/gain` | R/W | f `db` dB (-46–18) | PEQ high-freq band gain |
| `/fxreturn/{n}/peq/hf/freq` | R/W | f `hz` Hz (20–20000) | PEQ high-freq band frequency |
| `/fxreturn/{n}/peq/hf/q` | R/W | f `q` | PEQ high-freq band Q factor |
| `/fxreturn/{n}/peq/hf/shape` | R/W | i `shape` | PEQ high-freq band shape (0=Peak, 6=Low Shelf, 11=High Pass) |
| `/fxreturn/{n}/send/1` | R/W | f `level` (0–1) | Send level to mix bus 1 |
| `/fxreturn/{n}/send/2` | R/W | f `level` (0–1) | Send level to mix bus 2 |
| `/fxreturn/{n}/send/3` | R/W | f `level` (0–1) | Send level to mix bus 3 |
| `/fxreturn/{n}/send/4` | R/W | f `level` (0–1) | Send level to mix bus 4 |
| `/fxreturn/{n}/send/5` | R/W | f `level` (0–1) | Send level to mix bus 5 |
| `/fxreturn/{n}/send/6` | R/W | f `level` (0–1) | Send level to mix bus 6 |
| `/fxreturn/{n}/send/7` | R/W | f `level` (0–1) | Send level to mix bus 7 |
| `/fxreturn/{n}/send/8` | R/W | f `level` (0–1) | Send level to mix bus 8 |
| `/fxreturn/{n}/send/9` | R/W | f `level` (0–1) | Send level to mix bus 9 |
| `/fxreturn/{n}/send/10` | R/W | f `level` (0–1) | Send level to mix bus 10 |
| `/fxreturn/{n}/send/11` | R/W | f `level` (0–1) | Send level to mix bus 11 |
| `/fxreturn/{n}/send/12` | R/W | f `level` (0–1) | Send level to mix bus 12 |
| `/fxreturn/{n}/sendfx/1` | R/W | f `level` (0–1) | Send level to FX return 1 |
| `/fxreturn/{n}/sendfx/2` | R/W | f `level` (0–1) | Send level to FX return 2 |
| `/fxreturn/{n}/sendfx/3` | R/W | f `level` (0–1) | Send level to FX return 3 |
| `/fxreturn/{n}/sendfx/4` | R/W | f `level` (0–1) | Send level to FX return 4 |
| `/fxreturn/{n}/insert` | R/W | i `on` (0–1) | Insert enabled |
| `/fxreturn/{n}/pafl` | R/W | i `on` (0–1) | PAFL (solo) on/off |
| `/fxreturn/{n}/color` | W | i `r` (0–255), i `g` (0–255), i `b` (0–255) | Channel colour (send 0 0 0 for transparent) |

## Mix buses 1–12

| Address | R/W | Arguments | Description |
|---------|-----|-----------|-------------|
| `/bus/{n}/fader` | R/W | f `level` (0–1) | Fader level (0.0 = off, 1.0 = +10 dB) |
| `/bus/{n}/fader/db` | R |  | Fader level in dB (read-only, query only) |
| `/bus/{n}/mute` | R/W | i `muted` (0–1) | Mute state |
| `/bus/{n}/pan` | R/W | f `pan` (-1–1) | Pan position (-1.0 = full left, 0 = centre, +1.0 = full right) |
| `/bus/{n}/name` | R/W | s `name` | Channel name (max 6 characters) |
| `/bus/{n}/hpf/on` | R/W | i `on` (0–1) | High-pass filter on/off |
| `/bus/{n}/hpf/freq` | R/W | f `hz` Hz (20–2000) | High-pass filter frequency |
| `/bus/{n}/hpf/slope` | R/W | i `slope` dB/oct | High-pass filter slope |
| `/bus/{n}/comp/on` | R/W | i `on` (0–1) | Compressor on/off |
| `/bus/{n}/comp/threshold` | R/W | f `db` dB (-46–18) | Compressor threshold |
| `/bus/{n}/comp/ratio` | R/W | f `ratio` (1–undefined) | Compressor ratio (use 0 for ∞:1) |
| `/bus/{n}/comp/gain` | R/W | f `db` dB (0–18) | Compressor makeup gain |
| `/bus/{n}/delay/on` | R/W | i `on` (0–1) | Channel delay on/off |
| `/bus/{n}/delay/time` | R/W | f `ms` ms (0–341) | Channel delay time |
| `/bus/{n}/peq/on` | R/W | i `on` (0–1) | Parametric EQ on/off |
| `/bus/{n}/peq/lf/gain` | R/W | f `db` dB (-46–18) | PEQ low-freq band gain |
| `/bus/{n}/peq/lf/freq` | R/W | f `hz` Hz (20–20000) | PEQ low-freq band frequency |
| `/bus/{n}/peq/lf/q` | R/W | f `q` | PEQ low-freq band Q factor |
| `/bus/{n}/peq/lf/shape` | R/W | i `shape` | PEQ low-freq band shape (0=Peak, 6=Low Shelf, 11=High Pass) |
| `/bus/{n}/peq/lm/gain` | R/W | f `db` dB (-46–18) | PEQ low-mid band gain |
| `/bus/{n}/peq/lm/freq` | R/W | f `hz` Hz (20–20000) | PEQ low-mid band frequency |
| `/bus/{n}/peq/lm/q` | R/W | f `q` | PEQ low-mid band Q factor |
| `/bus/{n}/peq/hm/gain` | R/W | f `db` dB (-46–18) | PEQ high-mid band gain |
| `/bus/{n}/peq/hm/freq` | R/W | f `hz` Hz (20–20000) | PEQ high-mid band frequency |
| `/bus/{n}/peq/hm/q` | R/W | f `q` | PEQ high-mid band Q factor |
| `/bus/{n}/peq/hf/gain` | R/W | f `db` dB (-46–18) | PEQ high-freq band gain |
| `/bus/{n}/peq/hf/freq` | R/W | f `hz` Hz (20–20000) | PEQ high-freq band frequency |
| `/bus/{n}/peq/hf/q` | R/W | f `q` | PEQ high-freq band Q factor |
| `/bus/{n}/peq/hf/shape` | R/W | i `shape` | PEQ high-freq band shape (0=Peak, 6=Low Shelf, 11=High Pass) |
| `/bus/{n}/sendfx/1` | R/W | f `level` (0–1) | Send level to FX return 1 |
| `/bus/{n}/sendfx/2` | R/W | f `level` (0–1) | Send level to FX return 2 |
| `/bus/{n}/sendfx/3` | R/W | f `level` (0–1) | Send level to FX return 3 |
| `/bus/{n}/sendfx/4` | R/W | f `level` (0–1) | Send level to FX return 4 |
| `/bus/{n}/insert` | R/W | i `on` (0–1) | Insert enabled |
| `/bus/{n}/pafl` | R/W | i `on` (0–1) | PAFL (solo) on/off |
| `/bus/{n}/color` | W | i `r` (0–255), i `g` (0–255), i `b` (0–255) | Channel colour (send 0 0 0 for transparent) |

## DCA groups 1–8

| Address | R/W | Arguments | Description |
|---------|-----|-----------|-------------|
| `/dca/{n}/fader` | R/W | f `level` (0–1) | Fader level (0.0 = off, 1.0 = +10 dB) |
| `/dca/{n}/fader/db` | R |  | Fader level in dB (read-only, query only) |
| `/dca/{n}/mute` | R/W | i `muted` (0–1) | Mute state |
| `/dca/{n}/name` | R/W | s `name` | Channel name (max 6 characters) |
| `/dca/{n}/pafl` | R/W | i `on` (0–1) | PAFL (solo) on/off |

## Main L/R

| Address | R/W | Arguments | Description |
|---------|-----|-----------|-------------|
| `/main/fader` | R/W | f `level` (0–1) | Fader level (0.0 = off, 1.0 = +10 dB) |
| `/main/fader/db` | R |  | Fader level in dB (read-only, query only) |
| `/main/mute` | R/W | i `muted` (0–1) | Mute state |
| `/main/pan` | R/W | f `pan` (-1–1) | Pan position (-1.0 = full left, 0 = centre, +1.0 = full right) |
| `/main/name` | R/W | s `name` | Channel name (max 6 characters) |
| `/main/hpf/on` | R/W | i `on` (0–1) | High-pass filter on/off |
| `/main/hpf/freq` | R/W | f `hz` Hz (20–2000) | High-pass filter frequency |
| `/main/hpf/slope` | R/W | i `slope` dB/oct | High-pass filter slope |
| `/main/comp/on` | R/W | i `on` (0–1) | Compressor on/off |
| `/main/comp/threshold` | R/W | f `db` dB (-46–18) | Compressor threshold |
| `/main/comp/ratio` | R/W | f `ratio` (1–undefined) | Compressor ratio (use 0 for ∞:1) |
| `/main/comp/gain` | R/W | f `db` dB (0–18) | Compressor makeup gain |
| `/main/delay/on` | R/W | i `on` (0–1) | Channel delay on/off |
| `/main/delay/time` | R/W | f `ms` ms (0–341) | Channel delay time |
| `/main/peq/on` | R/W | i `on` (0–1) | Parametric EQ on/off |
| `/main/peq/lf/gain` | R/W | f `db` dB (-46–18) | PEQ low-freq band gain |
| `/main/peq/lf/freq` | R/W | f `hz` Hz (20–20000) | PEQ low-freq band frequency |
| `/main/peq/lf/q` | R/W | f `q` | PEQ low-freq band Q factor |
| `/main/peq/lf/shape` | R/W | i `shape` | PEQ low-freq band shape (0=Peak, 6=Low Shelf, 11=High Pass) |
| `/main/peq/lm/gain` | R/W | f `db` dB (-46–18) | PEQ low-mid band gain |
| `/main/peq/lm/freq` | R/W | f `hz` Hz (20–20000) | PEQ low-mid band frequency |
| `/main/peq/lm/q` | R/W | f `q` | PEQ low-mid band Q factor |
| `/main/peq/hm/gain` | R/W | f `db` dB (-46–18) | PEQ high-mid band gain |
| `/main/peq/hm/freq` | R/W | f `hz` Hz (20–20000) | PEQ high-mid band frequency |
| `/main/peq/hm/q` | R/W | f `q` | PEQ high-mid band Q factor |
| `/main/peq/hf/gain` | R/W | f `db` dB (-46–18) | PEQ high-freq band gain |
| `/main/peq/hf/freq` | R/W | f `hz` Hz (20–20000) | PEQ high-freq band frequency |
| `/main/peq/hf/q` | R/W | f `q` | PEQ high-freq band Q factor |
| `/main/peq/hf/shape` | R/W | i `shape` | PEQ high-freq band shape (0=Peak, 6=Low Shelf, 11=High Pass) |
| `/main/sendfx/1` | R/W | f `level` (0–1) | Send level to FX return 1 |
| `/main/sendfx/2` | R/W | f `level` (0–1) | Send level to FX return 2 |
| `/main/sendfx/3` | R/W | f `level` (0–1) | Send level to FX return 3 |
| `/main/sendfx/4` | R/W | f `level` (0–1) | Send level to FX return 4 |
| `/main/insert` | R/W | i `on` (0–1) | Insert enabled |
| `/main/pafl` | R/W | i `on` (0–1) | PAFL (solo) on/off |
| `/main/color` | W | i `r` (0–255), i `g` (0–255), i `b` (0–255) | Channel colour (send 0 0 0 for transparent) |

## Global / mixer-level

| Address | R/W | Arguments | Description |
|---------|-----|-----------|-------------|
| `/mute-group/{n}` | R/W | i `on` (0–1) | Mute group on/off (n=1–8) |
| `/scene/{n}/recall` | W |  | Recall scene n (n=1–300) |
| `/scene/{n}/store` | W |  | Store current state to scene n (n=1–300) |
| `/scene/{n}/delete` | W |  | Delete scene n (n=1–300) |
| `/scene/{n}/rename` | W | s `name` | Rename scene n (n=1–300) |
| `/scene/{n}/name` | R |  | Scene name, read-only (n=1–300) |
| `/scene/{n}/crossfade` | R/W | f `ms` ms (0–65535) | Per-scene crossfade time in ms (n=1–300) |
| `/talkback/on` | R/W | i `on` (0–1) | Talkback on/off |
| `/talkback/gain` | R/W | f `db` dB (-20–40) | Talkback microphone gain |
| `/talkback/phantom` | W | i `on` (0–1) | Talkback mic 48V phantom power |
| `/talkback/pad` | W | i `on` (0–1) | Talkback mic -20 dB pad |
| `/talkback/hpf/on` | W | i `on` (0–1) | Talkback high-pass filter on/off |
| `/talkback/hpf/freq` | W | f `hz` Hz (20–2000) | Talkback high-pass filter frequency |
| `/talkback/trim` | W | f `db` dB (-24–24) | Talkback mic trim |
| `/talkback/momentary` | W | i `momentary` (0–1) | Talkback momentary mode (1=hold-to-talk, 0=latch) |
| `/talkback/to/mainlr` | W | i `on` (0–1) | Talkback routed to Main L/R |
| `/talkback/to/group/{n}` | W | i `on` (0–1) | Talkback routed to group n (n=1–4) |
| `/talkback/to/aux/{n}` | W | i `on` (0–1) | Talkback routed to aux n (n=1–8) |
| `/talkback/to/matrix/{n}` | W | i `on` (0–1) | Talkback routed to matrix n (n=1–6) |
| `/directout/tappoint` | W | i `tap` (0–6) | Direct output tap point (0=PostPreamp 1=PostHPF 2=PostGate 3=PostInsert 4=PostPEQ 5=PostComp 6=PostDelay) |
| `/directout/follow/fader` | W | i `on` (0–1) | Direct out follows fader level |
| `/directout/follow/mute` | W | i `on` (0–1) | Direct out follows mute state |
| `/directout/follow/dcafader` | W | i `on` (0–1) | Direct out follows DCA fader |
| `/directout/follow/dcamute` | W | i `on` (0–1) | Direct out follows DCA mute |
| `/directout/follow/mutegroup` | W | i `on` (0–1) | Direct out follows mute groups |
| `/directout/level` | W | f `db` | Direct output level trim (send -999 for -∞/mute) |
| `/bridge/status` | R |  | Query bridge connection status — replies with 'connected' or 'disconnected' |
