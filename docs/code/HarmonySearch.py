from math import cos, pi
from random import random, randint


# Rastrigin function: many local minima, the global minimum is f(0, 0) = 0
def f(position):
    return 10 * len(position) + sum(x * x - 10 * cos(2 * pi * x) for x in position)


class HarmonySearch:

    # a harmony = a candidate solution, a note = one coordinate
    # hms: harmony memory size (the number of the best harmonies we remember)
    # hmcr: harmony memory considering rate - the probability to take a note from the memory
    # par: pitch adjusting rate - the probability to slightly change a note taken from the memory
    # bw: the bandwidth (the maximum change of the pitch adjustment) relative to the width of the search space
    def __init__(self, min_x, max_x, dimensions=2, hms=20, hmcr=0.9, par=0.3, bw=0.02, max_iteration=3000):
        self.min_x = min_x
        self.max_x = max_x
        self.dimensions = dimensions
        self.width = max_x - min_x
        self.hmcr = hmcr
        self.par = par
        self.bw = bw * self.width
        self.max_iteration = max_iteration
        self.memory = [[min_x + self.width * random() for _ in range(dimensions)] for _ in range(hms)]

    def run(self):

        for _ in range(self.max_iteration):
            new_harmony = self.improvise()

            # the new harmony replaces the WORST harmony in the memory if it is better
            worst = max(range(len(self.memory)), key=lambda k: f(self.memory[k]))

            if f(new_harmony) < f(self.memory[worst]):
                self.memory[worst] = new_harmony

        best = min(self.memory, key=f)
        print('Solution: %s with value: %s' % (best, f(best)))

    # every note of the new harmony is improvised independently
    def improvise(self):
        harmony = []

        for d in range(self.dimensions):
            if random() < self.hmcr:
                # memory consideration: take the note from a random harmony of the memory
                note = self.memory[randint(0, len(self.memory) - 1)][d]

                # pitch adjustment: a small random change
                if random() < self.par:
                    note += (2 * random() - 1) * self.bw
            else:
                # random selection: a completely new note
                note = self.min_x + self.width * random()

            harmony.append(min(self.max_x, max(self.min_x, note)))

        return harmony


if __name__ == '__main__':
    algorithm = HarmonySearch(min_x=-5.12, max_x=5.12)
    algorithm.run()
