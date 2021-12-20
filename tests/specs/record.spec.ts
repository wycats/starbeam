import { test, Expects, innerHTML } from "../support";

test("a record is a reactive value", ({ universe: timeline, test }) => {
  let first = timeline.cell("Tom");
  let last = timeline.cell("Dale");
  let id = timeline.static(1);

  let record = timeline.record({ first, last, id });

  let text = test.buildText(record.get("first"), Expects.dynamic);

  let { result, into } = test.render(text, Expects.dynamic);
  expect(innerHTML(into)).toBe("Tom");

  first.update("Thomas");
  timeline.poll(result);

  expect(innerHTML(into)).toBe("Thomas");
});
