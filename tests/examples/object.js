({
  field: 'value',

  add(a, b) {
    console.log(123);
    return a + b;
  },

  sub: (a, b) => a - b,
});
