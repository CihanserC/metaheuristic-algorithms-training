from math import cos, pi, exp
from random import random


# Rastrigin function: many local minima, the global minimum is f(0, 0) = 0
def f(position):
    return 10 * len(position) + sum(x * x - 10 * cos(2 * pi * x) for x in position)


class Bat:

    def __init__(self, min_x, max_x, dimensions, loudness, pulse_rate):
        self.position = [min_x + (max_x - min_x) * random() for _ in range(dimensions)]
        self.velocity = [0.0] * dimensions
        self.value = f(self.position)
        # loudness A: decreases when a bat gets close to the prey (the bat becomes quieter)
        self.loudness = loudness
        # pulse rate r: increases when a bat gets close to the prey
        self.pulse_rate = pulse_rate * 0.2


class BatAlgorithm:

    # f_max: the maximum frequency of the pulses (it controls the speed of the bats)
    # alpha: the decrease of the loudness, gamma: the increase of the pulse rate
    def __init__(self, min_x, max_x, dimensions=2, n_bats=20, f_max=2.0, loudness=1.0, pulse_rate=0.5,
                 alpha=0.9, gamma=0.9, max_iteration=120):
        self.min_x = min_x
        self.max_x = max_x
        self.dimensions = dimensions
        self.f_max = f_max
        self.pulse_rate = pulse_rate
        self.alpha = alpha
        self.gamma = gamma
        self.max_iteration = max_iteration
        self.bats = [Bat(min_x, max_x, dimensions, loudness, pulse_rate) for _ in range(n_bats)]
        self.best = min(self.bats, key=lambda b: b.value)
        self.best_position, self.best_value = self.best.position[:], self.best.value

    def run(self):
        width = self.max_x - self.min_x

        for t in range(self.max_iteration):
            mean_loudness = sum(b.loudness for b in self.bats) / len(self.bats)

            for bat in self.bats:
                # the frequency is random: the bat flies towards the best known position with this "speed"
                frequency = self.f_max * random()
                bat.velocity = [v + (x - b) * frequency for v, x, b in
                                zip(bat.velocity, bat.position, self.best_position)]
                new_position = [self.clamp(x + v) for x, v in zip(bat.position, bat.velocity)]

                # the bat is close to the best -> local random walk around the best solution
                if random() > bat.pulse_rate:
                    new_position = [self.clamp(b + 0.1 * width * (2 * random() - 1) * mean_loudness)
                                    for b in self.best_position]

                new_value = f(new_position)

                # the new solution is accepted if it is better AND the bat is "loud" enough
                if new_value <= bat.value and random() < bat.loudness:
                    bat.position, bat.value = new_position, new_value
                    bat.loudness *= self.alpha
                    bat.pulse_rate = self.pulse_rate * (1 - exp(-self.gamma * (t + 1)))

            for bat in self.bats:
                if bat.value < self.best_value:
                    self.best_position, self.best_value = bat.position[:], bat.value

        print('Solution: %s with value: %s' % (self.best_position, self.best_value))

    def clamp(self, x):
        return min(self.max_x, max(self.min_x, x))


if __name__ == '__main__':
    algorithm = BatAlgorithm(min_x=-5.12, max_x=5.12)
    algorithm.run()
