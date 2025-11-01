# Author: Rumaan Zameer | 1NH23CS207
# Co-Author: Rohit B | 1NH23CS205
# Org: New Horizon College Of Engineering, Bangalore, India
# Project: Digital Doctor
# Description: A medical query answering agent.
from langchain_ollama import OllamaLLM

ESC = "\x1b["

def col_print(role:int) -> None:
    string = ESC+str(role)+"m"
    print(string)

def reset():
    print(ESC+"0m")

model = OllamaLLM(model="digi-doc")

print("Digital Doctor\nVersion : 1.0.0\n\n" + "="*30)

while True:
    col_print(94)
    print("@user")
    query = input("Enter your query ('q'/'quit' to quit) >>> ")
    if query == 'q' or query =='quit':
        break
    reset()
    response = model.invoke(query)

    col_print(92)
    print("@digi-doc")
    print(response)
    reset()

    print("-"*30)

reset()