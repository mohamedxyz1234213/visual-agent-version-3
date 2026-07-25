import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://moodyelfouly:Qeuv4yxcpygCSG4t@cluster0.5ukqxgo.mongodb.net/test?appName=Cluster0';
const ADMIN_USER_ID = '6a233db8ad8094d99b69bca3';

const LESSON_PLANS = [
  {
    title: 'JavaScript Variables and Data Types',
    subject: 'JavaScript Fundamentals',
    difficulty: 'beginner',
    tags: ['variables', 'data-types', 'javascript-basics'],
    parts: [
      {
        title: 'Introduction to Variables',
        narration: 'Welcome to JavaScript Variables and Data Types. In this lesson, you will learn how to store data using variables and understand the different types of data JavaScript can work with. Variables are like labeled boxes where you store information. Let us start by understanding how to declare them.',
        durationSeconds: 30,
        scenes: [
          { timeOffset: 0, actionType: 'draw_highlight', payload: { position: [30, 30], width: 740, height: 500, color: '#f0f9ff', opacity: 0.3, rx: 16 } },
          { timeOffset: 0, actionType: 'draw_text', payload: { content: 'JavaScript Variables & Data Types', position: [50, 70], style: { fontSize: 36, color: '#0f172a', fontWeight: 'bold' } } },
          { timeOffset: 0, actionType: 'draw_badge', payload: { content: 'beginner', position: [620, 75], style: { bg: '#d4f542', color: '#18181b', fontSize: 14 } } },
          { timeOffset: 3, actionType: 'draw_text', payload: { content: 'What are Variables?', position: [50, 140], style: { fontSize: 24, color: '#1e293b', fontWeight: 'bold' } } },
          { timeOffset: 6, actionType: 'draw_text', payload: { content: '• Containers for storing data values\n• Declared with let, const, or var\n• let — can be reassigned (block-scoped)\n• const — cannot be reassigned (block-scoped)\n• var — old way, function-scoped (avoid)', position: [70, 190], style: { fontSize: 20, color: '#334155' } } },
          { timeOffset: 15, actionType: 'draw_rect', payload: { x: 50, y: 360, width: 700, height: 120, style: { fill: '#1e293b', stroke: '#0f172a', rx: 12 } } },
          { timeOffset: 18, actionType: 'draw_text', payload: { content: 'Code Example', position: [70, 390], style: { fontSize: 18, color: '#e2e8f0', fontWeight: 'bold' } } },
          { timeOffset: 20, actionType: 'draw_text', payload: { content: 'let score = 10;\nconst PI = 3.14;\nscore = 15; // OK\nPI = 3; // Error!', position: [70, 420], style: { fontSize: 16, color: '#94a3b8' } } },
        ],
      },
      {
        title: 'Primitive Data Types',
        narration: 'JavaScript has several primitive data types. String represents text, Number represents integers and decimals, Boolean is true or false, Undefined means a variable exists but has no value, and Null means intentionally empty. Let us explore each one with examples.',
        durationSeconds: 35,
        scenes: [
          { timeOffset: 0, actionType: 'draw_highlight', payload: { position: [30, 30], width: 740, height: 500, color: '#fefce8', opacity: 0.3, rx: 16 } },
          { timeOffset: 0, actionType: 'draw_text', payload: { content: 'Primitive Data Types', position: [50, 70], style: { fontSize: 32, color: '#0f172a', fontWeight: 'bold' } } },
          { timeOffset: 3, actionType: 'draw_text', payload: { content: '1. String — "Hello World"', position: [60, 140], style: { fontSize: 22, color: '#0f172a' } } },
          { timeOffset: 3, actionType: 'draw_badge', payload: { content: 'Text', position: [500, 135], style: { bg: '#ecfdf5', color: '#059669', fontSize: 13 } } },
          { timeOffset: 6, actionType: 'draw_text', payload: { content: '2. Number — 42, 3.14', position: [60, 190], style: { fontSize: 22, color: '#0f172a' } } },
          { timeOffset: 6, actionType: 'draw_badge', payload: { content: 'Numeric', position: [500, 185], style: { bg: '#eff6ff', color: '#2563eb', fontSize: 13 } } },
          { timeOffset: 9, actionType: 'draw_text', payload: { content: '3. Boolean — true, false', position: [60, 240], style: { fontSize: 22, color: '#0f172a' } } },
          { timeOffset: 9, actionType: 'draw_badge', payload: { content: 'Logic', position: [500, 235], style: { bg: '#fef2f2', color: '#dc2626', fontSize: 13 } } },
          { timeOffset: 12, actionType: 'draw_text', payload: { content: '4. Undefined — no value assigned', position: [60, 290], style: { fontSize: 22, color: '#0f172a' } } },
          { timeOffset: 15, actionType: 'draw_text', payload: { content: '5. Null — intentionally empty', position: [60, 340], style: { fontSize: 22, color: '#0f172a' } } },
          { timeOffset: 20, actionType: 'draw_rect', payload: { x: 50, y: 380, width: 700, height: 110, style: { fill: '#1e293b', stroke: '#0f172a', rx: 12 } } },
          { timeOffset: 22, actionType: 'draw_text', payload: { content: 'typeof "hi" → "string"\ntypeof 42 → "number"\ntypeof true → "boolean"\ntypeof undefined → "undefined"', position: [70, 410], style: { fontSize: 16, color: '#94a3b8' } } },
        ],
      },
      {
        title: 'Practice & Summary',
        narration: 'Now it is your turn. Try declaring variables of each type. Remember: use const by default, and only use let when you need to reassign. Practice by creating a user profile with a name, age, and login status. You have learned how variables work and the main data types in JavaScript.',
        durationSeconds: 25,
        scenes: [
          { timeOffset: 0, actionType: 'draw_highlight', payload: { position: [30, 30], width: 740, height: 500, color: '#f0fdf4', opacity: 0.3, rx: 16 } },
          { timeOffset: 0, actionType: 'draw_text', payload: { content: 'Practice Exercise', position: [50, 70], style: { fontSize: 32, color: '#0f172a', fontWeight: 'bold' } } },
          { timeOffset: 3, actionType: 'draw_text', payload: { content: 'Create a user profile:', position: [60, 130], style: { fontSize: 22, color: '#1e293b', fontWeight: 'bold' } } },
          { timeOffset: 5, actionType: 'draw_text', payload: { content: '1. const username = "CodeMaster";\n2. let age = 25;\n3. let isLoggedIn = true;\n4. let bio; // undefined\n5. Log everything to console!', position: [60, 180], style: { fontSize: 20, color: '#334155' } } },
          { timeOffset: 15, actionType: 'draw_text', payload: { content: 'Key Takeaways', position: [50, 310], style: { fontSize: 24, color: '#0f172a', fontWeight: 'bold' } } },
          { timeOffset: 17, actionType: 'draw_text', payload: { content: '✓ Use const by default, let when needed\n✓ JavaScript is dynamically typed\n✓ Primitives: String, Number, Boolean, Undefined, Null\n✓ typeof checks a variable type', position: [60, 355], style: { fontSize: 18, color: '#334155' } } },
          { timeOffset: 24, actionType: 'draw_badge', payload: { content: '✓ Complete', position: [320, 460], style: { bg: '#d4f542', color: '#18181b', fontSize: 18 } } },
        ],
      },
    ],
  },
  {
    title: 'JavaScript Functions and Scope',
    subject: 'JavaScript Fundamentals',
    difficulty: 'beginner',
    tags: ['functions', 'scope', 'hoisting'],
    parts: [
      {
        title: 'Introduction to Functions',
        narration: 'Functions are reusable blocks of code. You define them once and call them anywhere. JavaScript offers function declarations, expressions, and arrow functions. Each has different rules for hoisting and the this keyword.',
        durationSeconds: 30,
        scenes: [
          { timeOffset: 0, actionType: 'draw_highlight', payload: { position: [30, 30], width: 740, height: 500, color: '#f5f3ff', opacity: 0.3, rx: 16 } },
          { timeOffset: 0, actionType: 'draw_text', payload: { content: 'JavaScript Functions & Scope', position: [50, 70], style: { fontSize: 36, color: '#0f172a', fontWeight: 'bold' } } },
          { timeOffset: 3, actionType: 'draw_text', payload: { content: 'Three Ways to Write Functions:', position: [60, 140], style: { fontSize: 22, color: '#1e293b', fontWeight: 'bold' } } },
          { timeOffset: 6, actionType: 'draw_text', payload: { content: '1. Function Declaration\n   function greet(name) { ... }', position: [60, 190], style: { fontSize: 18, color: '#334155' } } },
          { timeOffset: 6, actionType: 'draw_badge', payload: { content: 'hoisted', position: [530, 188], style: { bg: '#dbeafe', color: '#1d4ed8', fontSize: 12 } } },
          { timeOffset: 10, actionType: 'draw_text', payload: { content: '2. Function Expression\n   const add = function(a, b) { ... }', position: [60, 240], style: { fontSize: 18, color: '#334155' } } },
          { timeOffset: 10, actionType: 'draw_badge', payload: { content: 'not hoisted', position: [530, 238], style: { bg: '#fef3c7', color: '#d97706', fontSize: 12 } } },
          { timeOffset: 14, actionType: 'draw_text', payload: { content: '3. Arrow Function\n   const square = x => x * x;', position: [60, 290], style: { fontSize: 18, color: '#334155' } } },
          { timeOffset: 14, actionType: 'draw_badge', payload: { content: 'ES6', position: [530, 288], style: { bg: '#d4f542', color: '#18181b', fontSize: 12 } } },
          { timeOffset: 20, actionType: 'draw_rect', payload: { x: 50, y: 360, width: 700, height: 130, style: { fill: '#1e293b', rx: 12 } } },
          { timeOffset: 22, actionType: 'draw_text', payload: { content: 'function double(x) { return x * 2; }\nconst triple = (x) => x * 3;\n\nconsole.log(double(5), triple(5));\n// Output: 10 15', position: [70, 390], style: { fontSize: 16, color: '#94a3b8' } } },
        ],
      },
      {
        title: 'Scope and Hoisting',
        narration: 'Scope determines where variables are accessible. Global scope is everywhere, function scope is inside a function, and block scope works with let and const inside curly braces. Hoisting means declarations are moved to the top of their scope during compilation.',
        durationSeconds: 30,
        scenes: [
          { timeOffset: 0, actionType: 'draw_highlight', payload: { position: [30, 30], width: 740, height: 500, color: '#fff7ed', opacity: 0.3, rx: 16 } },
          { timeOffset: 0, actionType: 'draw_text', payload: { content: 'Scope Types', position: [50, 70], style: { fontSize: 32, color: '#0f172a', fontWeight: 'bold' } } },
          { timeOffset: 4, actionType: 'draw_rect', payload: { x: 50, y: 120, width: 200, height: 80, style: { fill: '#dbeafe', stroke: '#3b82f6', rx: 10 } } },
          { timeOffset: 4, actionType: 'draw_text', payload: { content: 'Global', position: [100, 155], style: { fontSize: 22, color: '#1e40af', fontWeight: 'bold' } } },
          { timeOffset: 4, actionType: 'draw_rect', payload: { x: 270, y: 120, width: 200, height: 80, style: { fill: '#fef3c7', stroke: '#f59e0b', rx: 10 } } },
          { timeOffset: 4, actionType: 'draw_text', payload: { content: 'Function', position: [325, 155], style: { fontSize: 22, color: '#92400e', fontWeight: 'bold' } } },
          { timeOffset: 4, actionType: 'draw_rect', payload: { x: 490, y: 120, width: 200, height: 80, style: { fill: '#d4f542', stroke: '#a3e635', rx: 10 } } },
          { timeOffset: 4, actionType: 'draw_text', payload: { content: 'Block', position: [555, 155], style: { fontSize: 22, color: '#18181b', fontWeight: 'bold' } } },
          { timeOffset: 10, actionType: 'draw_text', payload: { content: 'Hoisting — declarations move to top', position: [60, 240], style: { fontSize: 22, color: '#0f172a', fontWeight: 'bold' } } },
          { timeOffset: 13, actionType: 'draw_rect', payload: { x: 50, y: 275, width: 700, height: 80, style: { fill: '#1e293b', rx: 12 } } },
          { timeOffset: 15, actionType: 'draw_text', payload: { content: 'console.log(x); // undefined (not error!)\nvar x = 5; // var is hoisted', position: [70, 305], style: { fontSize: 16, color: '#94a3b8' } } },
          { timeOffset: 20, actionType: 'draw_rect', payload: { x: 50, y: 370, width: 700, height: 80, style: { fill: '#1e293b', rx: 12 } } },
          { timeOffset: 22, actionType: 'draw_text', payload: { content: '// let/const: ReferenceError if used before declaration\nconsole.log(y); // ReferenceError!\nlet y = 10;', position: [70, 400], style: { fontSize: 16, color: '#94a3b8' } } },
        ],
      },
      {
        title: 'Closures',
        narration: 'A closure is a function that remembers its outer variables even after the outer function has returned. This is one of JavaScript most powerful features. Closures enable data privacy and function factories.',
        durationSeconds: 25,
        scenes: [
          { timeOffset: 0, actionType: 'draw_highlight', payload: { position: [30, 30], width: 740, height: 500, color: '#f0fdf4', opacity: 0.3, rx: 16 } },
          { timeOffset: 0, actionType: 'draw_text', payload: { content: 'Closures', position: [50, 70], style: { fontSize: 32, color: '#0f172a', fontWeight: 'bold' } } },
          { timeOffset: 0, actionType: 'draw_badge', payload: { content: 'Key Concept', position: [560, 75], style: { bg: '#fef2f2', color: '#dc2626', fontSize: 14 } } },
          { timeOffset: 4, actionType: 'draw_text', payload: { content: 'A function with preserved data', position: [60, 130], style: { fontSize: 22, color: '#1e293b', fontWeight: 'bold' } } },
          { timeOffset: 7, actionType: 'draw_rect', payload: { x: 50, y: 170, width: 700, height: 160, style: { fill: '#1e293b', rx: 12 } } },
          { timeOffset: 9, actionType: 'draw_text', payload: { content: 'function createCounter() {\n  let count = 0;\n  return function() {\n    count++;\n    return count;\n  };\n}\n\nconst counter = createCounter();\ncounter(); // 1\ncounter(); // 2', position: [70, 200], style: { fontSize: 16, color: '#94a3b8' } } },
          { timeOffset: 20, actionType: 'draw_text', payload: { content: '✓ Data privacy — count cannot be accessed directly\n✓ Persistence — state lives between calls\n✓ Factory pattern — each call creates a new closure', position: [60, 360], style: { fontSize: 18, color: '#334155' } } },
        ],
      },
    ],
  },
  {
    title: 'JavaScript Arrays and Objects',
    subject: 'JavaScript Fundamentals',
    difficulty: 'beginner',
    tags: ['arrays', 'objects', 'data-structures'],
    parts: [
      {
        title: 'Arrays',
        narration: 'Arrays are ordered collections. You can store any type of data in them and access items by their index. JavaScript arrays come with powerful methods like push, pop, map, filter, and reduce that make data manipulation easy.',
        durationSeconds: 30,
        scenes: [
          { timeOffset: 0, actionType: 'draw_highlight', payload: { position: [30, 30], width: 740, height: 500, color: '#f5f3ff', opacity: 0.3, rx: 16 } },
          { timeOffset: 0, actionType: 'draw_text', payload: { content: 'JavaScript Arrays & Objects', position: [50, 70], style: { fontSize: 36, color: '#0f172a', fontWeight: 'bold' } } },
          { timeOffset: 0, actionType: 'draw_badge', payload: { content: 'beginner', position: [620, 75], style: { bg: '#d4f542', color: '#18181b', fontSize: 14 } } },
          { timeOffset: 3, actionType: 'draw_text', payload: { content: 'Arrays — ordered, indexed collections', position: [60, 140], style: { fontSize: 24, color: '#1e293b', fontWeight: 'bold' } } },
          { timeOffset: 6, actionType: 'draw_rect', payload: { x: 50, y: 185, width: 700, height: 90, style: { fill: '#1e293b', rx: 12 } } },
          { timeOffset: 8, actionType: 'draw_text', payload: { content: 'let fruits = ["apple", "banana", "orange"];\nconsole.log(fruits[0]); // "apple"\nconsole.log(fruits.length); // 3', position: [70, 210], style: { fontSize: 16, color: '#94a3b8' } } },
          { timeOffset: 14, actionType: 'draw_text', payload: { content: 'Key Methods:', position: [60, 310], style: { fontSize: 20, color: '#0f172a', fontWeight: 'bold' } } },
          { timeOffset: 16, actionType: 'draw_text', payload: { content: 'push/pop — add/remove at end\nunshift/shift — add/remove at start\nmap — transform each element\nfilter — keep matching elements\nreduce — accumulate values', position: [60, 345], style: { fontSize: 18, color: '#334155' } } },
        ],
      },
      {
        title: 'Objects',
        narration: 'Objects store key-value pairs. They represent real-world entities with properties and methods. You can access properties using dot notation or bracket notation, and you can add, update, or delete properties dynamically.',
        durationSeconds: 25,
        scenes: [
          { timeOffset: 0, actionType: 'draw_highlight', payload: { position: [30, 30], width: 740, height: 500, color: '#fefce8', opacity: 0.3, rx: 16 } },
          { timeOffset: 0, actionType: 'draw_text', payload: { content: 'Objects — key-value pairs', position: [50, 70], style: { fontSize: 32, color: '#0f172a', fontWeight: 'bold' } } },
          { timeOffset: 4, actionType: 'draw_rect', payload: { x: 50, y: 120, width: 700, height: 130, style: { fill: '#1e293b', rx: 12 } } },
          { timeOffset: 6, actionType: 'draw_text', payload: { content: 'let person = {\n  name: "Alice",\n  age: 25,\n  greet() {\n    console.log("Hi, I\'m " + this.name);\n  }\n};\n\nconsole.log(person.name);  // "Alice"\nperson.greet();           // "Hi, I\'m Alice"', position: [70, 150], style: { fontSize: 16, color: '#94a3b8' } } },
          { timeOffset: 15, actionType: 'draw_text', payload: { content: 'Access: person.name or person["name"]\nAdd: person.city = "New York"\nDelete: delete person.age\nKeys: Object.keys(person)', position: [60, 290], style: { fontSize: 18, color: '#334155' } } },
          { timeOffset: 22, actionType: 'draw_text', payload: { content: 'Destructuring: const { name, age } = person\nSpread: const clone = { ...person, city: "NYC" }', position: [60, 380], style: { fontSize: 18, color: '#334155' } } },
        ],
      },
      {
        title: 'Practice Challenge',
        narration: 'Create an array of your favorite movies as objects. Each movie should have a title, year, and rating. Then use map to create a list of titles, filter to find movies after 2010, and reduce to calculate the average rating.',
        durationSeconds: 20,
        scenes: [
          { timeOffset: 0, actionType: 'draw_highlight', payload: { position: [30, 30], width: 740, height: 500, color: '#f0fdf4', opacity: 0.3, rx: 16 } },
          { timeOffset: 0, actionType: 'draw_text', payload: { content: 'Practice Challenge', position: [50, 70], style: { fontSize: 32, color: '#0f172a', fontWeight: 'bold' } } },
          { timeOffset: 3, actionType: 'draw_text', payload: { content: 'const movies = [\n  { title: "Inception", year: 2010, rating: 8.8 },\n  { title: "The Matrix", year: 1999, rating: 8.7 },\n  { title: "Interstellar", year: 2014, rating: 8.6 }\n];', position: [60, 130], style: { fontSize: 18, color: '#334155' } } },
          { timeOffset: 10, actionType: 'draw_text', payload: { content: '1. movies.map(m => m.title)\n2. movies.filter(m => m.year > 2010)\n3. movies.reduce((sum, m) => sum + m.rating, 0) / movies.length', position: [60, 250], style: { fontSize: 18, color: '#334155' } } },
          { timeOffset: 18, actionType: 'draw_badge', payload: { content: 'Try it!', position: [330, 400], style: { bg: '#d4f542', color: '#18181b', fontSize: 18 } } },
        ],
      },
    ],
  },
  {
    title: 'JavaScript Loops and Iteration',
    subject: 'JavaScript Fundamentals',
    difficulty: 'intermediate',
    tags: ['loops', 'iteration', 'control-flow'],
    parts: [
      {
        title: 'Loop Types',
        narration: 'Loops let you repeat code efficiently. JavaScript provides for, while, and do-while loops, plus modern iteration methods like forEach, for-of, and for-in for working with collections.',
        durationSeconds: 30,
        scenes: [
          { timeOffset: 0, actionType: 'draw_highlight', payload: { position: [30, 30], width: 740, height: 500, color: '#f0f9ff', opacity: 0.3, rx: 16 } },
          { timeOffset: 0, actionType: 'draw_text', payload: { content: 'JavaScript Loops & Iteration', position: [50, 70], style: { fontSize: 36, color: '#0f172a', fontWeight: 'bold' } } },
          { timeOffset: 0, actionType: 'draw_badge', payload: { content: 'intermediate', position: [600, 75], style: { bg: '#fef3c7', color: '#92400e', fontSize: 14 } } },
          { timeOffset: 4, actionType: 'draw_rect', payload: { x: 50, y: 130, width: 330, height: 100, style: { fill: '#1e293b', rx: 12 } } },
          { timeOffset: 6, actionType: 'draw_text', payload: { content: 'for (let i = 0; i < 5; i++) {\n  console.log(i);\n} // 0,1,2,3,4', position: [65, 155], style: { fontSize: 15, color: '#94a3b8' } } },
          { timeOffset: 4, actionType: 'draw_rect', payload: { x: 400, y: 130, width: 330, height: 100, style: { fill: '#1e293b', rx: 12 } } },
          { timeOffset: 6, actionType: 'draw_text', payload: { content: 'let i = 0;\nwhile (i < 5) {\n  console.log(i); i++;\n}', position: [415, 155], style: { fontSize: 15, color: '#94a3b8' } } },
          { timeOffset: 12, actionType: 'draw_rect', payload: { x: 50, y: 250, width: 330, height: 100, style: { fill: '#1e293b', rx: 12 } } },
          { timeOffset: 14, actionType: 'draw_text', payload: { content: 'const arr = [1, 2, 3];\nfor (const val of arr) {\n  console.log(val);\n} // for...of', position: [65, 275], style: { fontSize: 15, color: '#94a3b8' } } },
          { timeOffset: 12, actionType: 'draw_rect', payload: { x: 400, y: 250, width: 330, height: 100, style: { fill: '#1e293b', rx: 12 } } },
          { timeOffset: 14, actionType: 'draw_text', payload: { content: 'arr.forEach(v => {\n  console.log(v);\n}); // forEach', position: [415, 275], style: { fontSize: 15, color: '#94a3b8' } } },
          { timeOffset: 22, actionType: 'draw_text', payload: { content: 'break — exit loop\ncontinue — skip to next iteration\n⚠ Off-by-one errors are the most common bug!', position: [60, 390], style: { fontSize: 18, color: '#334155' } } },
        ],
      },
    ],
  },
  {
    title: 'DOM Manipulation',
    subject: 'JavaScript Web APIs',
    difficulty: 'intermediate',
    tags: ['dom', 'html', 'browser-api'],
    parts: [
      {
        title: 'Selecting and Modifying Elements',
        narration: 'The DOM allows JavaScript to interact with HTML elements. Use querySelector and querySelectorAll to find elements, then modify their content, attributes, and styles. Create new elements with createElement and add them to the page.',
        durationSeconds: 30,
        scenes: [
          { timeOffset: 0, actionType: 'draw_highlight', payload: { position: [30, 30], width: 740, height: 500, color: '#f5f3ff', opacity: 0.3, rx: 16 } },
          { timeOffset: 0, actionType: 'draw_text', payload: { content: 'DOM Manipulation', position: [50, 70], style: { fontSize: 36, color: '#0f172a', fontWeight: 'bold' } } },
          { timeOffset: 0, actionType: 'draw_badge', payload: { content: 'intermediate', position: [600, 75], style: { bg: '#fef3c7', color: '#92400e', fontSize: 14 } } },
          { timeOffset: 4, actionType: 'draw_text', payload: { content: 'Selecting Elements', position: [60, 130], style: { fontSize: 22, color: '#1e293b', fontWeight: 'bold' } } },
          { timeOffset: 7, actionType: 'draw_text', payload: { content: 'document.querySelector(".btn")    // first match\ndocument.querySelectorAll("p")    // all matches\ndocument.getElementById("header") // by ID', position: [60, 170], style: { fontSize: 18, color: '#334155' } } },
          { timeOffset: 14, actionType: 'draw_text', payload: { content: 'Modifying Content & Styles', position: [60, 260], style: { fontSize: 22, color: '#1e293b', fontWeight: 'bold' } } },
          { timeOffset: 17, actionType: 'draw_rect', payload: { x: 50, y: 300, width: 700, height: 90, style: { fill: '#1e293b', rx: 12 } } },
          { timeOffset: 19, actionType: 'draw_text', payload: { content: 'el.textContent = "Hello";\nel.style.color = "red";\nel.classList.add("active");\nel.setAttribute("src", "img.jpg");', position: [70, 325], style: { fontSize: 16, color: '#94a3b8' } } },
          { timeOffset: 25, actionType: 'draw_text', payload: { content: 'Creating: document.createElement("div")\nAdding: parent.appendChild(el)\nRemoving: el.remove()', position: [60, 420], style: { fontSize: 18, color: '#334155' } } },
        ],
      },
    ],
  },
  {
    title: 'Events and Event Handling',
    subject: 'JavaScript Web APIs',
    difficulty: 'intermediate',
    tags: ['events', 'listeners', 'interactivity'],
    parts: [
      {
        title: 'Event Listeners and Types',
        narration: 'Events make pages interactive. Add event listeners to respond to clicks, key presses, form submissions, and more. The event object provides details about what happened. Event delegation lets you handle events efficiently for many elements.',
        durationSeconds: 30,
        scenes: [
          { timeOffset: 0, actionType: 'draw_highlight', payload: { position: [30, 30], width: 740, height: 500, color: '#fff7ed', opacity: 0.3, rx: 16 } },
          { timeOffset: 0, actionType: 'draw_text', payload: { content: 'Events & Event Handling', position: [50, 70], style: { fontSize: 36, color: '#0f172a', fontWeight: 'bold' } } },
          { timeOffset: 3, actionType: 'draw_text', payload: { content: 'element.addEventListener("click", handler);', position: [60, 130], style: { fontSize: 20, color: '#1e293b' } } },
          { timeOffset: 3, actionType: 'draw_rect', payload: { x: 530, y: 120, width: 200, height: 40, style: { fill: '#d4f542', rx: 8 } } },
          { timeOffset: 3, actionType: 'draw_text', payload: { content: 'Pattern', position: [600, 145], style: { fontSize: 16, color: '#18181b', fontWeight: 'bold' } } },
          { timeOffset: 8, actionType: 'draw_text', payload: { content: 'Common Events:', position: [60, 200], style: { fontSize: 20, color: '#0f172a', fontWeight: 'bold' } } },
          { timeOffset: 10, actionType: 'draw_text', payload: { content: '• click, dblclick — mouse clicks\n• keydown, keyup — keyboard\n• submit — form submission\n• input — value changes\n• mouseenter, mouseleave — hover', position: [60, 235], style: { fontSize: 18, color: '#334155' } } },
          { timeOffset: 18, actionType: 'draw_text', payload: { content: 'Event Object:', position: [60, 340], style: { fontSize: 20, color: '#0f172a', fontWeight: 'bold' } } },
          { timeOffset: 20, actionType: 'draw_text', payload: { content: 'e.target — the clicked element\ne.type — event type\ne.preventDefault() — cancel default\ne.stopPropagation() — stop bubbling', position: [60, 375], style: { fontSize: 18, color: '#334155' } } },
        ],
      },
    ],
  },
  {
    title: 'Error Handling and Debugging',
    subject: 'JavaScript Fundamentals',
    difficulty: 'intermediate',
    tags: ['errors', 'debugging', 'try-catch'],
    parts: [
      {
        title: 'Try/Catch and Error Types',
        narration: 'Errors happen. JavaScript provides try-catch blocks to handle them gracefully. You can also throw custom errors. Understanding ReferenceError, TypeError, and SyntaxError helps you debug faster. Use console methods and breakpoints to find issues.',
        durationSeconds: 30,
        scenes: [
          { timeOffset: 0, actionType: 'draw_highlight', payload: { position: [30, 30], width: 740, height: 500, color: '#fef2f2', opacity: 0.3, rx: 16 } },
          { timeOffset: 0, actionType: 'draw_text', payload: { content: 'Error Handling & Debugging', position: [50, 70], style: { fontSize: 36, color: '#0f172a', fontWeight: 'bold' } } },
          { timeOffset: 4, actionType: 'draw_rect', payload: { x: 50, y: 130, width: 700, height: 100, style: { fill: '#1e293b', rx: 12 } } },
          { timeOffset: 6, actionType: 'draw_text', payload: { content: 'try {\n  let result = riskyOperation();\n  console.log(result);\n} catch (error) {\n  console.error("Failed:", error.message);\n} finally {\n  console.log("This always runs");\n}', position: [70, 155], style: { fontSize: 15, color: '#94a3b8' } } },
          { timeOffset: 14, actionType: 'draw_text', payload: { content: 'Error Types:', position: [60, 270], style: { fontSize: 20, color: '#0f172a', fontWeight: 'bold' } } },
          { timeOffset: 16, actionType: 'draw_text', payload: { content: '• ReferenceError — undefined variable\n• TypeError — wrong value type\n• SyntaxError — invalid syntax\n• RangeError — value out of range', position: [60, 305], style: { fontSize: 18, color: '#334155' } } },
          { timeOffset: 22, actionType: 'draw_text', payload: { content: 'Debugging: console.log, console.warn, console.error\nBreakpoints: debugger; statement in code', position: [60, 395], style: { fontSize: 18, color: '#334155' } } },
        ],
      },
    ],
  },
  {
    title: 'Async Programming Basics',
    subject: 'JavaScript Advanced',
    difficulty: 'advanced',
    tags: ['async', 'promises', 'callbacks'],
    parts: [
      {
        title: 'Promises and Async/Await',
        narration: 'JavaScript is single-threaded. Async programming lets it handle long operations like API calls without blocking. Promises represent future values, and async-await makes promise-based code read like synchronous code.',
        durationSeconds: 30,
        scenes: [
          { timeOffset: 0, actionType: 'draw_highlight', payload: { position: [30, 30], width: 740, height: 500, color: '#f0fdf4', opacity: 0.3, rx: 16 } },
          { timeOffset: 0, actionType: 'draw_text', payload: { content: 'Async Programming Basics', position: [50, 70], style: { fontSize: 36, color: '#0f172a', fontWeight: 'bold' } } },
          { timeOffset: 0, actionType: 'draw_badge', payload: { content: 'advanced', position: [600, 75], style: { bg: '#fef2f2', color: '#dc2626', fontSize: 14 } } },
          { timeOffset: 4, actionType: 'draw_text', payload: { content: 'Promises — a future value', position: [60, 130], style: { fontSize: 22, color: '#1e293b', fontWeight: 'bold' } } },
          { timeOffset: 7, actionType: 'draw_rect', payload: { x: 50, y: 165, width: 700, height: 100, style: { fill: '#1e293b', rx: 12 } } },
          { timeOffset: 9, actionType: 'draw_text', payload: { content: 'fetch("https://api.example.com")\n  .then(res => res.json())\n  .then(data => console.log(data))\n  .catch(err => console.error(err));', position: [70, 190], style: { fontSize: 16, color: '#94a3b8' } } },
          { timeOffset: 16, actionType: 'draw_text', payload: { content: 'Async/Await — syntactic sugar', position: [60, 300], style: { fontSize: 22, color: '#1e293b', fontWeight: 'bold' } } },
          { timeOffset: 19, actionType: 'draw_rect', payload: { x: 50, y: 335, width: 700, height: 110, style: { fill: '#1e293b', rx: 12 } } },
          { timeOffset: 21, actionType: 'draw_text', payload: { content: 'async function getData() {\n  try {\n    const res = await fetch("url");\n    return await res.json();\n  } catch (e) {\n    console.error(e);\n  }\n}', position: [70, 360], style: { fontSize: 16, color: '#94a3b8' } } },
        ],
      },
    ],
  },
];

function makeScene(partIdx, sceneIdx, scene) {
  return {
    partId: null,
    timeOffset: scene.timeOffset,
    actionType: scene.actionType,
    payload: scene.payload,
  };
}

async function main() {
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;
  console.log('Connected to MongoDB\n');

  // Clean up existing
  console.log('Cleaning existing data...');
  const delLessons = await db.collection('lessons').deleteMany({});
  const delParts = await db.collection('lessonparts').deleteMany({});
  const delScenes = await db.collection('storyboardscenes').deleteMany({});
  const delCoding = await db.collection('codinglessons').deleteMany({});
  console.log(`  Deleted ${delLessons.deletedCount} lessons, ${delParts.deletedCount} parts, ${delScenes.deletedCount} scenes, ${delCoding.deletedCount} coding lessons`);

  let totalScenes = 0;

  for (const plan of LESSON_PLANS) {
    console.log(`\nCreating: ${plan.title} (${plan.difficulty})`);

    // Create the Lesson document
    const lessonDoc = {
      title: plan.title,
      subject: plan.subject,
      sourceFilename: `programming-lesson-${plan.title.toLowerCase().replace(/\s+/g, '-')}`,
      summary: `Learn ${plan.title} — ${plan.parts.length} sections covering key concepts with examples.`,
      status: 'ready',
      processingStep: 'done',
      aiProvider: 'blaze',
      analysisModel: 'glm-5.2',
      seriesId: null,
      lessonIndex: 0,
      totalLessons: 1,
      ownerId: new mongoose.Types.ObjectId(ADMIN_USER_ID),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const lessonResult = await db.collection('lessons').insertOne(lessonDoc);
    const lessonId = lessonResult.insertedId;
    console.log(`  Lesson ID: ${lessonId}`);

    // Create parts and scenes
    for (let pi = 0; pi < plan.parts.length; pi++) {
      const part = plan.parts[pi];
      const partDoc = {
        lessonId: lessonId,
        orderIndex: pi,
        title: part.title,
        narration: part.narration,
        durationSeconds: part.durationSeconds,
        audioUrl: null,
        partType: 'content',
      };
      const partResult = await db.collection('lessonparts').insertOne(partDoc);
      const partId = partResult.insertedId;

      // Create scenes for this part
      const sceneDocs = part.scenes.map((s, si) => ({
        partId: partId,
        timeOffset: s.timeOffset,
        actionType: s.actionType,
        payload: s.payload,
      }));
      if (sceneDocs.length > 0) {
        await db.collection('storyboardscenes').insertMany(sceneDocs);
      }
      totalScenes += sceneDocs.length;
      console.log(`  Part ${pi + 1}: "${part.title}" (${part.durationSeconds}s, ${sceneDocs.length} scenes)`);
    }

    // Create the CodingLesson entry that links to this whiteboard lesson
    const partsContent = plan.parts.map(p =>
      `## ${p.title}\n\n${p.narration}`
    ).join('\n\n');

    await db.collection('codinglessons').insertOne({
      title: plan.title,
      subjectId: null,
      teacherId: new mongoose.Types.ObjectId(ADMIN_USER_ID),
      schoolId: null,
      content: partsContent,
      difficulty: plan.difficulty,
      duration: plan.parts.reduce((s, p) => s + Math.round(p.durationSeconds / 60), 0),
      tags: plan.tags,
      order: LESSON_PLANS.indexOf(plan) + 1,
      isPublished: true,
      hasAvatarVersion: true,
      avatarLessonId: lessonId,
      codeSnippets: [],
      viewCount: 0,
      totalExercises: 0,
      totalStudents: 0,
      averageScore: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log(`  CodingLesson entry created (avatarLessonId: ${lessonId})`);
  }

  console.log(`\n=== Done! Created ${LESSON_PLANS.length} lessons with ${totalScenes} total scenes ===`);
  await mongoose.disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
