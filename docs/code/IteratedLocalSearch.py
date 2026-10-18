from math import sin
from random import random, uniform


def f(x):
    return sin(x) + 0.5 * sin(3 * x) + 0.25 * sin(7 * x)


class IteratedLocalSearch:

    # delta: step size of the local search (hill climbing)
    # patience: the local search stops after `patience` steps without improvement -> we are on a local optimum
    # kick: the strength of the perturbation that throws us out of that local optimum
    def __init__(self, min_x, max_x, delta=0.3, patience=25, kick=2.5, max_iteration=800):
        self.min_x = min_x
        self.max_x = max_x
        self.delta = delta
        self.patience = patience
        self.kick = kick
        self.max_iteration = max_iteration

    def run(self):

        work = self.generate_random_x()
        local_optimum = None
        best_state = work
        stuck = 0

        for _ in range(self.max_iteration):

            # 1. local search: plain hill climbing
            new_state = self.clamp(work + uniform(-self.delta, self.delta))

            if f(new_state) > f(work):
                work = new_state
                stuck = 0
            else:
                stuck += 1

            # 2. we are stuck -> work is a local optimum
            if stuck >= self.patience:

                # 3. acceptance criterion: keep the new local optimum only if it is not worse than the old one
                if local_optimum is None or f(work) >= f(local_optimum):
                    local_optimum = work

                if f(local_optimum) > f(best_state):
                    best_state = local_optimum

                # 4. perturbation (kick): jump away from the accepted local optimum and climb again
                work = self.clamp(local_optimum + uniform(-self.kick, self.kick))
                stuck = 0

        print('Global maximum: x=%s f(x)=%s' % (best_state, f(best_state)))

    def clamp(self, x):
        return min(self.max_x, max(self.min_x, x))

    def generate_random_x(self):
        return self.min_x + (self.max_x - self.min_x) * random()


if __name__ == '__main__':
    algorithm = IteratedLocalSearch(0, 10)
    algorithm.run()
