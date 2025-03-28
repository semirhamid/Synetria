# subscribe to a zeromq sub and print the messages for demo

import zmq

context = zmq.Context()
socket = context.socket(zmq.SUB)
socket.connect("tcp://127.0.0.1:5555]")
socket.setsockopt_string(zmq.SUBSCRIBE, "")  # Subscribe to all messages

while True:
    print("receiving string")
    message = socket.recv_string()
    print(f"[Client Manager] Received: {message}")