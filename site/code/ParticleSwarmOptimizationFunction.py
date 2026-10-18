from random import random
import numpy as np


def f(x):
    return (x+1)*(x+1)*np.sin(x)


class Particle:

    def __init__(self, min_x, max_x, dimensions=1):
        # this is the interval we are dealing with [min_x,max_x]
        self.min_x = min_x
        self.max_x = max_x
        # this is the position of a particle - dimension dependent variable
        # 2 dimensions: (x,y) coordinates
        # 3 dimensions: (x,y,z) coordinates
        # N dimensions: (x1,x2,x3...xN) coordinates
        self.position = self.initialize(dimensions)
        # velocity parameter of the particle
        self.velocity = self.initialize(dimensions)
        # we have to track the global best position
        self.best_position = self.position
        # depending on the problem [it is the f(best_position)]
        self.best_value = 1e10

    def move(self):
        new_position = self.position + self.velocity
        # when updating the positions and velocities we have to consider the boundaries
        # upper bound: max_x - lower bound: min_x
        new_position = np.where(new_position > self.max_x, self.max_x, new_position)
        new_position = np.where(new_position < self.min_x, self.min_x, new_position)
        self.position = new_position

    def initialize(self, x):
        return np.array([self.min_x + (self.max_x - self.min_x) * random() for _ in range(x)])

    def __repr__(self):
        return ' '.join(str(e) for e in self.position)


class ParticleSwarmOptimization:

    # c1=0 it means there is no individual actions - all the particles behave according to the global best position
    # so the particle is not affected by its own best position so far (just the global position exclusively)
    # THIS IS 100% EXPLOITATION !!!
    # c2=0 it means the particles are totally independent of each other (no interaction between them
    # and no information exchange between the particles)
    # in this case particles don't care about the global optimum
    # THIS IS 100% EXPLORATION !!!
    def __init__(self, min_x, max_x, n_particles=100, max_iteration=30, w=0.7, c1=1.4, c2=1.2):
        self.n_particles = n_particles
        self.max_iteration = max_iteration
        self.particles = [Particle(min_x, max_x) for _ in range(n_particles)]
        # these are the global best values (fitness) and positions
        # and there are the best parameters for every single particle
        self.best_value = 1e10
        self.best_position = self.particles[0].position
        # inertia weight (exploration and exploitation trade-off)
        self.w = w
        # cognitive (local) and social (global) weights
        self.c1 = c1
        self.c2 = c2

    def run(self):

        counter = 0

        while counter < self.max_iteration:
            counter += 1

            self.move_particles()
            self.set_best()
            self.set_particle_best()

        print('Solution: %s with value: %s' % (self.best_position, self.best_value))

    def set_particle_best(self):
        for particle in self.particles:
            particle_fitness = f(particle.position)

            if particle.best_value > particle_fitness:
                particle.best_value = particle_fitness
                particle.best_position = particle.position

    def set_best(self):
        for particle in self.particles:
            particle_fitness = f(particle.position)

            if self.best_value > particle_fitness:
                self.best_value = particle_fitness
                self.best_position = particle.position

    def move_particles(self):
        for particle in self.particles:
            new_velocity = self.w * particle.velocity + self.c1 * random() * (
                        particle.best_position - particle.position) + \
                           self.c2 * random() * (self.best_position - particle.position)
            particle.velocity = new_velocity
            particle.move()


if __name__ == '__main__':
    algorithm = ParticleSwarmOptimization(min_x=-4, max_x=2)
    algorithm.run()
