-- PulseFit seed data. Safe to run repeatedly: existing rows are left untouched.

INSERT INTO exercises (name, muscle_group, sets, reps, difficulty, rest_seconds, description) VALUES
  -- Chest
  ('Barbell Bench Press',      'Chest',  4, '8',       'Intermediate', 90,  'Flat barbell press. Keep shoulder blades pinned and feet planted.'),
  ('Incline Dumbbell Press',   'Chest',  3, '10',      'Beginner',     75,  'Press on a 30-degree incline to target the upper chest.'),
  ('Cable Fly',                'Chest',  3, '12-15',   'Beginner',     60,  'Slight bend in the elbows, squeeze at the centre.'),
  ('Weighted Push-Up',         'Chest',  3, '12',      'Intermediate', 60,  'Plate on the back, chest to the floor every rep.'),
  ('Dumbbell Pullover',        'Chest',  3, '12',      'Advanced',     75,  'Lie across a bench and arc the dumbbell over the head.'),
  -- Back
  ('Conventional Deadlift',    'Back',   4, '5',       'Advanced',     150, 'Brace hard, push the floor away, lock out with the glutes.'),
  ('Weighted Pull-Up',         'Back',   4, '6-8',     'Advanced',     90,  'Full hang to chin over the bar. Add weight when 8 reps is easy.'),
  ('Bent-Over Row',            'Back',   3, '10',      'Intermediate', 90,  'Hinge at the hips, pull the bar to the lower ribs.'),
  ('Lat Pulldown',             'Back',   3, '12',      'Beginner',     60,  'Lead with the elbows and keep the torso tall.'),
  ('Seated Cable Row',         'Back',   3, '12',      'Beginner',     60,  'Pull to the navel, pause, then control the return.'),
  -- Legs
  ('Back Squat',               'Legs',   5, '5',       'Advanced',     150, 'Bar on the traps, sit between the hips, drive up.'),
  ('Romanian Deadlift',        'Legs',   3, '10',      'Intermediate', 90,  'Soft knees, hinge until you feel the hamstrings load.'),
  ('Walking Lunges',           'Legs',   3, '12 / leg','Beginner',     60,  'Long steps, front shin vertical, torso upright.'),
  ('Leg Press',                'Legs',   4, '12',      'Beginner',     75,  'Feet shoulder width, lower until the knees hit 90 degrees.'),
  ('Bulgarian Split Squat',    'Legs',   3, '10 / leg','Intermediate', 75,  'Rear foot elevated. Keep the weight through the front heel.'),
  -- Arms
  ('EZ-Bar Curl',              'Arms',   3, '12',      'Beginner',     60,  'Elbows glued to the sides, no swinging.'),
  ('Skull Crushers',           'Arms',   3, '10',      'Intermediate', 60,  'Lower the bar to the forehead and extend without flaring.'),
  ('Hammer Curl',              'Arms',   3, '12',      'Beginner',     60,  'Neutral grip to hit the brachialis and forearms.'),
  ('Weighted Dips',            'Arms',   3, '8',       'Advanced',     90,  'Lean slightly forward, lower until the upper arm is parallel.'),
  ('Overhead Cable Extension', 'Arms',   3, '15',      'Beginner',     45,  'Rope overhead, extend fully and squeeze the triceps.'),
  -- Core
  ('Plank Hold',               'Core',   3, '60s',     'Beginner',     45,  'Straight line from head to heels. Squeeze glutes and quads.'),
  ('Hanging Leg Raise',        'Core',   3, '12',      'Intermediate', 60,  'Hang from the bar and raise straight legs to hip height.'),
  ('Cable Crunch',             'Core',   3, '15',      'Beginner',     45,  'Kneel under the cable and crunch the ribs toward the hips.'),
  ('Ab Wheel Rollout',         'Core',   3, '10',      'Advanced',     60,  'Roll out as far as you can hold a neutral spine.'),
  ('Russian Twist',            'Core',   3, '20',      'Beginner',     45,  'Heels hovering, rotate the chest, not just the arms.'),
  -- Cardio
  ('Rowing Intervals',         'Cardio', 6, '250m',    'Intermediate', 60,  'Hard 250 m pieces. Legs, body, arms on every stroke.'),
  ('Treadmill Sprints',        'Cardio', 8, '30s',     'Advanced',     60,  'All-out 30 second sprints with a full minute of walking rest.'),
  ('Assault Bike',             'Cardio', 5, '45s',     'Intermediate', 75,  'Push and pull with the arms. Keep the cadence high.'),
  ('Jump Rope',                'Cardio', 4, '2 min',   'Beginner',     45,  'Light on the toes, wrists do the work.'),
  ('Stair Climber',            'Cardio', 3, '5 min',   'Beginner',     60,  'Steady pace, no leaning on the rails.')
ON CONFLICT (name) DO NOTHING;

-- Ten classes for the current week (Monday to Sunday).
INSERT INTO classes (title, category, coach_name, start_time, duration_minutes, capacity, intensity) VALUES
  ('Sunrise Yoga',        'Yoga',     'Maya Kim',     date_trunc('week', now()) + interval '0 day 06:30', 60, 20, 1),
  ('HIIT Blast',          'HIIT',     'Dre Watts',    date_trunc('week', now()) + interval '0 day 18:00', 45, 16, 3),
  ('Spin Express',        'Spin',     'Lena Park',    date_trunc('week', now()) + interval '1 day 07:00', 30, 24, 2),
  ('Boxing Fundamentals', 'Boxing',   'Marco Diaz',   date_trunc('week', now()) + interval '1 day 19:00', 60, 14, 3),
  ('Barbell Strength',    'Strength', 'Sam Okafor',   date_trunc('week', now()) + interval '2 day 12:15', 60, 12, 2),
  ('Spin & Core',         'Spin',     'Lena Park',    date_trunc('week', now()) + interval '2 day 18:30', 45, 24, 2),
  ('HIIT 360',            'HIIT',     'Dre Watts',    date_trunc('week', now()) + interval '3 day 06:45', 40, 16, 3),
  ('Boxing Sparring',     'Boxing',   'Marco Diaz',   date_trunc('week', now()) + interval '3 day 19:30', 60, 12, 3),
  ('Flow & Restore',      'Yoga',     'Maya Kim',     date_trunc('week', now()) + interval '4 day 17:30', 60, 20, 1),
  ('Weekend Strength',    'Strength', 'Sam Okafor',   date_trunc('week', now()) + interval '5 day 09:30', 60, 12, 2)
ON CONFLICT (title, start_time) DO NOTHING;
