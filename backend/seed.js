require('dotenv').config();
const mongoose = require('mongoose');
const Lesson = require('./models/Lesson');

const lessons = [
  // HTML
  {
    id: 'html-basics-1',
    language: 'html',
    title: 'Hello HTML',
    description: 'Learn the basic structure of an HTML page.',
    unit: 'Basics',
    order: 1,
    xpReward: 20,
    challenges: [
      {
        id: 'c1',
        type: 'code',
        title: 'Your First Tag',
        description: 'Create a heading that says Hello World',
        instructions: 'Write an \u003ch1\u003e tag with the text "Hello World".',
        starterCode: '\u003c!-- Write your code below --\u003e\n',
        expectedOutput: '\u003ch1\u003ehello world\u003c/h1\u003e',
        hints: ['Use \u003ch1\u003e tags for the main heading',
          'Close the tag with \u003c/h1\u003e'
        ],
        xpReward: 10
      },
      {
        id: 'c2',
        type: 'code',
        title: 'Add a Paragraph',
        description: 'Add a paragraph under your heading.',
        instructions: 'Add a \u003cp\u003e tag with any text.',
        starterCode: '\u003ch1\u003eHello World\u003c/h1\u003e\n',
        expectedOutput: '\u003ch1\u003ehello world\u003c/h1\u003e\u003cp\u003e',
        hints: ['Use \u003cp\u003e tags for paragraphs'
        ],
        xpReward: 10
      }
    ]
  },
  {
    id: 'html-basics-2',
    language: 'html',
    title: 'Links & Lists',
    description: 'Create links and lists in HTML.',
    unit: 'Basics',
    order: 2,
    xpReward: 25,
    prerequisites: ['html-basics-1'
    ],
    challenges: [
      {
        id: 'c1',
        type: 'code',
        title: 'Create a Link',
        description: 'Make a link that goes to google.com',
        instructions: 'Write an \u003ca\u003e tag linking to https://google.com with text "Google".',
        starterCode: '',
        expectedOutput: '\u003ca href="https://google.com"\u003egoogle\u003c/a\u003e',
        hints: ['Use the href attribute'
        ],
        xpReward: 10
      },
      {
        id: 'c2',
        type: 'code',
        title: 'Make a List',
        description: 'Create an unordered list with 2 items',
        instructions: 'Create a \u003cul\u003e with two \u003cli\u003e items.',
        starterCode: '',
        expectedOutput: '\u003cul\u003e\u003cli\u003e',
        hints: ['\u003cul\u003e is unordered list, \u003cli\u003e is list item'
        ],
        xpReward: 10
      }
    ]
  },
  {
    id: 'html-basics-3',
    language: 'html',
    title: 'Images & Inputs',
    description: 'Embed images and create input fields.',
    unit: 'Basics',
    order: 3,
    xpReward: 25,
    prerequisites: ['html-basics-2'
    ],
    challenges: [
      {
        id: 'c1',
        type: 'code',
        title: 'Add an Image',
        description: 'Insert an image',
        instructions: 'Add an \u003cimg\u003e tag with src "cat.jpg" and alt "A cat".',
        starterCode: '',
        expectedOutput: '\u003cimg src="cat.jpg" alt="a cat">',
        hints: ['\u003cimg\u003e is self-closing'
        ],
        xpReward: 10
      }
    ]
  },
  // CSS
  {
    id: 'css-basics-1',
    language: 'css',
    title: 'Colors & Fonts',
    description: 'Style text with colors and fonts.',
    unit: 'Basics',
    order: 1,
    xpReward: 20,
    challenges: [
      {
        id: 'c1',
        type: 'code',
        title: 'Change Text Color',
        description: 'Make h1 red',
        instructions: 'Write CSS to make all h1 elements red.',
        starterCode: '/* Write your CSS below */\n',
        expectedOutput: 'h1 { color: red; }',
        hints: ['Use the color property'
        ],
        xpReward: 10
      },
      {
        id: 'c2',
        type: 'code',
        title: 'Center Text',
        description: 'Center align all paragraphs',
        instructions: 'Write CSS to center align \u003cp\u003e elements.',
        starterCode: '',
        expectedOutput: 'p { text-align: center; }',
        hints: ['Use text-align: center'
        ],
        xpReward: 10
      }
    ]
  },
  {
    id: 'css-basics-2',
    language: 'css',
    title: 'Box Model',
    description: 'Understand padding, border, and margin.',
    unit: 'Basics',
    order: 2,
    xpReward: 25,
    prerequisites: ['css-basics-1'
    ],
    challenges: [
      {
        id: 'c1',
        type: 'code',
        title: 'Add Padding',
        description: 'Give div 20px padding',
        instructions: 'Set padding of div to 20px.',
        starterCode: '',
        expectedOutput: 'div { padding: 20px; }',
        hints: ['padding: 20px'
        ],
        xpReward: 10
      }
    ]
  },
  {
    id: 'css-basics-3',
    language: 'css',
    title: 'Flexbox Intro',
    description: 'Learn the basics of Flexbox layout.',
    unit: 'Basics',
    order: 3,
    xpReward: 30,
    prerequisites: ['css-basics-2'
    ],
    challenges: [
      {
        id: 'c1',
        type: 'code',
        title: 'Enable Flex',
        description: 'Make .container a flex container',
        instructions: 'Set display: flex on .container',
        starterCode: '',
        expectedOutput: '.container { display: flex; }',
        hints: ['display: flex'
        ],
        xpReward: 10
      }
    ]
  },
  // JavaScript
  {
    id: 'js-basics-1',
    language: 'javascript',
    title: 'Variables & Console',
    description: 'Learn to declare variables and log to console.',
    unit: 'Basics',
    order: 1,
    xpReward: 20,
    challenges: [
      {
        id: 'c1',
        type: 'code',
        title: 'Declare a Variable',
        description: 'Create a variable called name',
        instructions: 'Use let to declare a variable called name with value "Coddy".',
        starterCode: '// Write your code below\n',
        expectedOutput: 'let name = "coddy";',
        hints: ['let name = "Coddy";'
        ],
        xpReward: 10
      },
      {
        id: 'c2',
        type: 'code',
        title: 'Console Log',
        description: 'Print something to the console',
        instructions: 'Use console.log to print "Hello JS".',
        starterCode: '',
        expectedOutput: 'console.log("hello js");',
        hints: ['console.log("Hello JS");'
        ],
        xpReward: 10
      }
    ]
  },
  {
    id: 'js-basics-2',
    language: 'javascript',
    title: 'Functions',
    description: 'Write your first JavaScript function.',
    unit: 'Basics',
    order: 2,
    xpReward: 25,
    prerequisites: ['js-basics-1'
    ],
    challenges: [
      {
        id: 'c1',
        type: 'code',
        title: 'Create a Function',
        description: 'Make a function that returns 42',
        instructions: 'Write a function answer() that returns 42.',
        starterCode: '',
        expectedOutput: 'function answer() { return 42; }',
        hints: ['function answer() { return 42; }'
        ],
        xpReward: 10
      }
    ]
  },
  {
    id: 'js-basics-3',
    language: 'javascript',
    title: 'Arrays & Loops',
    description: 'Work with arrays and for loops.',
    unit: 'Basics',
    order: 3,
    xpReward: 30,
    prerequisites: ['js-basics-2'
    ],
    challenges: [
      {
        id: 'c1',
        type: 'code',
        title: 'Create an Array',
        description: 'Make an array of fruits',
        instructions: 'Create an array called fruits with "apple" and "banana".',
        starterCode: '',
        expectedOutput: 'let fruits = ["apple", "banana"];',
        hints: ['Use square brackets []'
        ],
        xpReward: 10
      }
    ]
  }
];

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/coddy');
  await Lesson.deleteMany({});
  await Lesson.insertMany(lessons);
  console.log('Lessons seeded!');
  process.exit();
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
