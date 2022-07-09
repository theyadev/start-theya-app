import { green, lightBlue, lightGreen, red } from 'kolorist';

export const FRAMEWORKS = [
  {
    name: 'next',
    color: lightBlue,
    variants: [
      {
        name: 'socketio',
        color: green,
      },
      {
        name: 'redis',
        color: red,
      },
      {
        name: 'mongodb',
        color: lightGreen,
      },
      {
        name: 'tailwindcss',
        color: lightBlue,
      },
    ],
  },
  {
    name: 'nuxt3',
    color: lightGreen,
    variants: [
      {
        name: 'socketio',
        color: green,
      },
      {
        name: 'redis',
        color: red,
      },
    ],
  },
];
