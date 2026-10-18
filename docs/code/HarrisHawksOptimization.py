from math import cos, pi, sin, gamma
from random import random, randint, gauss


# Rastrigin function: many local minima, the global minimum is f(0, 0) = 0
def f(position):
    return 10 * len(position) + sum(x * x - 10 * cos(2 * pi * x) for x in position)


class HarrisHawksOptimization:

    def __init__(self, min_x, max_x, dimensions=2, n_hawks=20, max_iteration=100):
        self.min_x = min_x
        self.max_x = max_x
        self.dimensions = dimensions
        self.max_iteration = max_iteration
        self.hawks = [[min_x + (max_x - min_x) * random() for _ in range(dimensions)] for _ in range(n_hawks)]
        self.rabbit = min(self.hawks, key=f)[:]

    def run(self):
        width = self.max_x - self.min_x

        for iteration in range(self.max_iteration):
            mean = [sum(h[d] for h in self.hawks) / len(self.hawks) for d in range(self.dimensions)]

            for i, hawk in enumerate(self.hawks):
                # the energy of the rabbit decreases while it is escaping: |E| >= 1 exploration, |E| < 1 exploitation
                E = 2 * (2 * random() - 1) * (1 - iteration / self.max_iteration)

                if abs(E) >= 1:
                    # exploration: the hawks perch randomly and wait (two equally likely strategies)
                    if random() < 0.5:
                        other = self.hawks[randint(0, len(self.hawks) - 1)]
                        new_position = [o - random() * abs(o - 2 * random() * x) for x, o in zip(hawk, other)]
                    else:
                        new_position = [(r - m) - random() * (self.min_x + random() * width)
                                        for r, m in zip(self.rabbit, mean)]
                    self.hawks[i] = self.clamp(new_position)
                    continue

                # exploitation: the surprise pounce - 4 strategies depending on the energy E and the escape chance r
                r = random()
                J = 2 * (1 - random())  # the random jump strength of the rabbit

                if r >= 0.5 and abs(E) >= 0.5:
                    # soft besiege
                    new_position = [(rb - x) - E * abs(J * rb - x) for x, rb in zip(hawk, self.rabbit)]
                elif r >= 0.5:
                    # hard besiege
                    new_position = [rb - E * abs(rb - x) for x, rb in zip(hawk, self.rabbit)]
                else:
                    # (soft / hard) besiege with progressive rapid dives: Levy flights
                    base = hawk if abs(E) >= 0.5 else mean
                    y = self.clamp([rb - E * abs(J * rb - b) for rb, b in zip(self.rabbit, base)])
                    z = self.clamp([v + 0.4 * width * self.levy() * (random() - 0.5) * 2 for v in y])

                    new_position = y if f(y) < f(hawk) else (z if f(z) < f(hawk) else hawk)

                new_position = self.clamp(new_position)

                # in the exploitation phase a hawk moves only if the new position is better
                if f(new_position) < f(hawk):
                    self.hawks[i] = new_position

            candidate = min(self.hawks, key=f)

            if f(candidate) < f(self.rabbit):
                self.rabbit = candidate[:]

        print('Solution: %s with value: %s' % (self.rabbit, f(self.rabbit)))

    @staticmethod
    def levy(beta=1.5):
        sigma = (gamma(1 + beta) * sin(pi * beta / 2) / (gamma((1 + beta) / 2) * beta * 2 ** ((beta - 1) / 2))) \
                ** (1 / beta)
        return 0.01 * gauss(0, sigma) / abs(gauss(0, 1)) ** (1 / beta)

    def clamp(self, position):
        return [min(self.max_x, max(self.min_x, x)) for x in position]


if __name__ == '__main__':
    algorithm = HarrisHawksOptimization(min_x=-5.12, max_x=5.12)
    algorithm.run()
