import torch

x = torch.tensor([[1.0, 2.0, 3.0]])
w = torch.tensor([[0.2], [0.5], [0.3]])
y = x @ w

print("Input:", x)
print("Weight:", w)
print("Output:", y)
