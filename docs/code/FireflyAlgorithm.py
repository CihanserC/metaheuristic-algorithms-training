from math import cos, pi, exp, sqrt
from random import random


# Rastrigin function: many local minima, the global minimum is f(0, 0) = 0
def f(position):
    return 10 * len(position) + sum(x * x - 10 * cos(2 * pi * x) for x in position)


class FireflyAlgorithm:

    # a firefly is attracted to every BRIGHTER firefly (the brightness is the quality of the solution)
    # beta0: the attractiveness at distance 0
    # gamma: the light absorption - the bigger it is the faster the attraction decreases with the distance
    # alpha: the strength of the random walk (it decays during the run)
    def __init__(self, min_x, max_x, dimensions=2, n_fireflies=20, alpha=0.3, beta0=1.0, gamma=2.0,
                 max_iteration=80):
        self.min_x = min_x
        self.max_x = max_x
        self.dimensions = dimensions
        self.width = max_x - min_x
        self.alpha = alpha
        self.beta0 = beta0
        self.gamma = gamma
        self.max_iteration = max_iteration
        self.fireflies = [[min_x + self.width * random() for _ in range(dimensions)] for _ in range(n_fireflies)]
        self.values = [f(x) for x in self.fireflies]

    def run(self):

        for _ in range(self.max_iteration):
            for i in range(len(self.fireflies)):
                for j in range(len(self.fireflies)):

                    # we are minimizing: the smaller the value the brighter the firefly
                    if self.values[j] < self.values[i]:
                        # the distance is normalized by the width of the search space
                        r = sqrt(sum((a - b) ** 2 for a, b in zip(self.fireflies[i], self.fireflies[j]))) / self.width

                        # the attractiveness decreases exponentially with the distance
                        beta = self.beta0 * exp(-self.gamma * r * r)

                        # move towards the brighter firefly + a small random step
                        self.fireflies[i] = [min(self.max_x, max(self.min_x,
                                                                 xi + beta * (xj - xi)
                                                                 + self.alpha * (random() - 0.5) * self.width))
                                             for xi, xj in zip(self.fireflies[i], self.fireflies[j])]
                        self.values[i] = f(self.fireflies[i])

            # the randomness is reduced during the run: from exploration to exploitation
            self.alpha *= 0.97

        best = min(range(len(self.fireflies)), key=lambda k: self.values[k])
        print('Solution: %s with value: %s' % (self.fireflies[best], self.values[best]))


if __name__ == '__main__':
    algorithm = FireflyAlgorithm(min_x=-5.12, max_x=5.12)
    algorithm.run()
