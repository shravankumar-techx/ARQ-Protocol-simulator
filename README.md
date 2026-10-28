# ARQ-Protocol-simulator
Interactive ARQ protocol simulator: One-Bit Sliding Window, Go-Back-N and Selective Repeat on a lossy link, with a live time-sequence diagram, performance statistics and side-by-side comparison. Pure HTML, CSS and JavaScript.
# ARQ Protocol Simulator

An interactive simulation of three sliding-window ARQ protocols running over an unreliable link:

- One-Bit Sliding Window (stop-and-wait)
- Go-Back-N
- Selective Repeat

Built for the Computer Network and Its Applications course, Department of CSE (AI & ML). It runs entirely in the browser, with no installs, no build step and no libraries.

## Features

- Live time-sequence diagram: frames and ACKs travel between sender and receiver, lost packets stop with a red X, and retransmissions and timeouts are highlighted.
- Sender and receiver window strip showing each frame as sent, retransmitted or acknowledged.
- Event log of every send, loss, timeout and ACK.
- Playback controls: pause, resume, skip to end, reset and speed control.
- Final statistics for the chosen protocol.
- Side-by-side comparison of all three protocols, with a text block in the "PROTOCOL COMPARISON" format.
- Repeatable runs through a random seed.

## Getting started

1. Clone or download this repository.
2. Open `index.html` in a modern browser (Chrome, Edge or Firefox).
3. Choose a protocol, set the parameters and press **Start simulation**.

To host it online, enable GitHub Pages for the main branch.

## Parameters

| Parameter | Meaning |
|---|---|
| Protocol | One-Bit SW, Go-Back-N or Selective Repeat |
| Window size | Frames allowed in flight (fixed at 1 for One-Bit SW) |
| Frames | Number of frames to send |
| Transmission delay | One-way delay of a frame, in ms |
| ACK delay | One-way delay of an ACK, in ms |
| Packet loss | Chance a frame is lost, in % |
| ACK loss | Chance an ACK is lost, in % |
| Timeout | Time the sender waits before retransmitting, in ms |
| Random seed | Makes a run exactly repeatable |

## Statistics

- Total frames transmitted, including retransmissions
- Number of retransmissions
- Packets (frames) lost
- ACKs received
- Total transmission time
- Throughput: the share of link capacity used, assuming the sender emits one frame every 20 ms
- Efficiency: useful frames divided by total frames transmitted

## How the protocols behave

- **One-Bit SW:** sends one frame and waits for its ACK before sending the next.
- **Go-Back-N:** the receiver accepts frames only in order and sends cumulative ACKs. On a timeout, the sender resends from the oldest unacknowledged frame onward.
- **Selective Repeat:** the receiver buffers out-of-order frames and ACKs each one. Each frame has its own timer, so only the lost frame is resent.

## Fair comparison

Whether a frame or ACK is lost depends only on the seed, the frame number and the attempt number, not on the order of events. All three protocols therefore face the same losses, and the comparison stays fair.

## Project structure

```
arq-simulator/
├── index.html        page structure
├── style.css         layout and colours
├── simulation.js     protocol engine (discrete-event simulation)
└── app.js            animation, diagram, log, results and comparison
```

## Team

- Name (USN)
- Name (USN)
- Name (USN)
- Name (USN)

## License

Released for academic use. Add a license of your choice (for example MIT) before reusing it.
