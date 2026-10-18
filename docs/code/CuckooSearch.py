from math import cos, pi, sin, gamma
from random import random, gauss, randint


# Rastrigin function: many local minima, the global minimum is f(0, 0) = 0
def f(position):
    return 10 * len(position) + sum(x * x - 10 * cos(2 * pi * x) for x in position)


class CuckooSearch:

    # pa: the probability that the host bird discovers an alien egg (the nest is abandoned)
    # alpha: the scale of the Levy flights
    def __init__(self, min_x, max_x, dimensions=2, n_nests=20, pa=0.25, alpha=1.0, max_iteration=120):
        self.min_x = min_x
        self.max_x = max_x
        self.dimensions = dimensions
        self.width = max_x - min_x
        self.pa = pa
        self.alpha = alpha
        self.max_iteration = max_iteration
        self.nests = [[min_x + self.width * random() for _ in range(dimensions)] for _ in range(n_nests)]
        self.values = [f(x) for x in self.nests]

    def run(self):

        for _ in range(self.max_iteration):
            best = self.nests[min(range(len(self.nests)), key=lambda k: self.values[k])]

            # 1. every cuckoo lays an egg in a new nest using a Levy flight:
            # many small steps and from time to time a very long jump (exploration + exploitation)
            for i in range(len(self.nests)):
                new_nest = [self.clamp(x + self.alpha * self.levy() * (x - b) * gauss(0, 1) * 0.1
                                       + 0.002 * self.width * gauss(0, 1))
                            for x, b in zip(self.nests[i], best)]

                if f(new_nest) < self.values[i]:
                    self.nests[i], self.values[i] = new_nest, f(new_nest)

            # 2. a fraction pa of the nests is discovered by the host birds: they are replaced by new ones
            # built from the positions of other nests (a random walk)
            for i in range(len(self.nests)):
                if random() < self.pa:
                    a = self.nests[randint(0, len(self.nests) - 1)]
                    b = self.nests[randint(0, len(self.nests) - 1)]
                    new_nest = [self.clamp(x + random() * (p - q)) for x, p, q in zip(self.nests[i], a, b)]

                    if f(new_nest) < self.values[i]:
                        self.nests[i], self.values[i] = new_nest, f(new_nest)

        best = min(range(len(self.nests)), key=lambda k: self.values[k])
        print('Solution: %s with value: %s' % (self.nests[best], self.values[best]))

    # Levy flight step generated with the Mantegna algorithm (beta = 1.5)
    @staticmethod
    def levy(beta=1.5):
        sigma = (gamma(1 + beta) * sin(pi * beta / 2) / (gamma((1 + beta) / 2) * beta * 2 ** ((beta - 1) / 2))) \
                ** (1 / beta)
        return gauss(0, sigma) / abs(gauss(0, 1)) ** (1 / beta)

    def clamp(self, x):
        return min(self.max_x, max(self.min_x, x))


if __name__ == '__main__':
    algorithm = CuckooSearch(min_x=-5.12, max_x=5.12)
    algorithm.run()
