from math import sin
from random import random, uniform


def f(x):
    return sin(x) + 0.5 * sin(3 * x) + 0.25 * sin(7 * x)


class ThresholdAccepting:

    # threshold: the maximum deterioration we are willing to accept (the "temperature" of this algorithm)
    # decay: the threshold shrinks geometrically in every iteration
    def __init__(self, min_x, max_x, delta=0.3, threshold=1.0, decay=0.99, max_iteration=800):
        self.min_x = min_x
        self.max_x = max_x
        self.delta = delta
        self.threshold = threshold
        self.decay = decay
        self.max_iteration = max_iteration
        self.actual_state = min_x + (max_x - min_x) * random()
        self.best_state = self.actual_state

    def run(self):

        threshold = self.threshold

        for _ in range(self.max_iteration):
            new_state = min(self.max_x, max(self.min_x, self.actual_state + uniform(-self.delta, self.delta)))

            # unlike simulated annealing there is no randomness in the decision:
            # a worse state is accepted if it is worse by less than the threshold
            if f(new_state) >= f(self.actual_state) - threshold:
                self.actual_state = new_state

            if f(self.actual_state) > f(self.best_state):
                self.best_state = self.actual_state

            threshold *= self.decay

        print('Global maximum: x=%s f(x)=%s' % (self.best_state, f(self.best_state)))


if __name__ == '__main__':
    algorithm = ThresholdAccepting(0, 10)
    algorithm.run()
