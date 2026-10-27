import { animalIdFromQr, findAnimal } from "@/lib/scan";

const animals = [{ id: "a", tag_number: "C-12" }, { id: "b", tag_number: "G-3" }];

test("a tag QR code opens its animal, even one not loaded yet", () => {
  expect(animalIdFromQr("https://www.farmflows.app/dashboard/cattle/0F8FAD5B-D9CB-469F-A165-70867728950E")).toBe("0f8fad5b-d9cb-469f-a165-70867728950e");
  expect(findAnimal("https://www.farmflows.app/dashboard/cattle/0f8fad5b-d9cb-469f-a165-70867728950e", animals)).toEqual({ id: "0f8fad5b-d9cb-469f-a165-70867728950e" });
});

test("a typed tag number, any case, with or without #", () => {
  expect(findAnimal(" #c-12 ", animals)).toEqual(animals[0]);
  expect(findAnimal("G-3", animals)).toEqual(animals[1]);
  expect(findAnimal("X-1", animals)).toBeNull();
  expect(findAnimal("https://example.com/hello", animals)).toBeNull();
  expect(findAnimal("", animals)).toBeNull();
});
