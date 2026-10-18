from math import cos, pi
from random import random, randint, choice


# Rastrigin function: many local minima, the global minimum is f(0, 0) = 0
def f(position):
    return 10 * len(position) + sum(x * x - 10 * cos(2 * pi * x) for x in position)


class TeachingLearningBasedOptimization:

    # the only parameters are the population size (the class) and the number of iterations
    # there is no algorithm specific parameter to tune
    def __init__(self, min_x, max_x, dimensions=2, class_size=20, max_iteration=60):
        self.min_x = min_x
        self.max_x = max_x
        self.dimensions = dimensions
        self.max_iteration = max_iteration
        self.learners = [[min_x + (max_x - min_x) * random() for _ in range(dimensions)] for _ in range(class_size)]

    def run(self):

        for _ in range(self.max_iteration):
            # the teacher is the best learner of the class and the mean is the "level" of the class
            teacher = min(self.learners, key=f)
            mean = [sum(l[d] for l in self.learners) / len(self.learners) for d in range(self.dimensions)]

            # phase 1 - the teacher phase: the learners move towards the teacher (relative to the class mean)
            for i in range(len(self.learners)):
                teaching_factor = choice([1, 2])
                new_learner = [x + random() * (t - teaching_factor * m)
                               for x, t, m in zip(self.learners[i], teacher, mean)]
                self.accept_if_better(i, new_learner)

            # phase 2 - the learner phase: two learners interact: the weaker one learns from the better one
            for i in range(len(self.learners)):
                j = i
                while j == i:
                    j = randint(0, len(self.learners) - 1)

                direction = 1 if f(self.learners[i]) < f(self.learners[j]) else -1
                new_learner = [x + direction * random() * (x - y)
                               for x, y in zip(self.learners[i], self.learners[j])]
                self.accept_if_better(i, new_learner)

        best = min(self.learners, key=f)
        print('Solution: %s with value: %s' % (best, f(best)))

    # greedy selection: a learner changes only if the new knowledge is better
    def accept_if_better(self, index, new_learner):
        new_learner = [min(self.max_x, max(self.min_x, x)) for x in new_learner]

        if f(new_learner) < f(self.learners[index]):
            self.learners[index] = new_learner


if __name__ == '__main__':
    algorithm = TeachingLearningBasedOptimization(min_x=-5.12, max_x=5.12)
    algorithm.run()
