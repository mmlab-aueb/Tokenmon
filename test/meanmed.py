import sys
import statistics

data = []

def median(datas):
    datas.sort()
    return datas[len(datas) // 2]

with open(sys.argv[1]) as f:
    for line in f:
        data.append(int(line.split(" ")[2]))

data.sort()
data = [num/1000.0 for num in data]
print(round(sum(data)/float(len(data)), 2), round(median(data),2), round(statistics.stdev(data),2))