import {
  validateLogEntry,
  validateLogEntryForm,
  createLogEntry,
  logEntrySchema,
  logEntryFormSchema,
} from "../validation";

describe("Validation Tests", () => {
  describe("logEntrySchema", () => {
    it("should validate a valid log entry", () => {
      const validEntry = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        grams: 0.5,
        priceEUR: 10.5,
        buzz: 7,
        method: "Vaporizer",
        note: "Great session",
        date: "2024-01-15T10:30:00.000Z",
      };

      const result = validateLogEntry(validEntry);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validEntry);
      }
    });

    it("should reject invalid grams", () => {
      const invalidEntry = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        grams: -1,
        buzz: 5,
        date: "2024-01-15T10:30:00.000Z",
      };

      const result = validateLogEntry(invalidEntry);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain("positive");
      }
    });

    it("should reject invalid buzz level", () => {
      const invalidEntry = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        grams: 0.5,
        buzz: 11,
        date: "2024-01-15T10:30:00.000Z",
      };

      const result = validateLogEntry(invalidEntry);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain("10");
      }
    });

    it("should reject invalid date format", () => {
      const invalidEntry = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        grams: 0.5,
        buzz: 5,
        date: "invalid-date",
      };

      const result = validateLogEntry(invalidEntry);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain("Invalid date format");
      }
    });
  });

  describe("logEntryFormSchema", () => {
    it("should validate form data without id", () => {
      const validFormData = {
        grams: 0.5,
        priceEUR: 10.5,
        buzz: 7,
        method: "Vaporizer",
        note: "Great session",
        date: "2024-01-15T10:30:00.000Z",
      };

      const result = validateLogEntryForm(validFormData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validFormData);
      }
    });

    it("should accept form data with id (extra properties are allowed)", () => {
      const formDataWithId = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        grams: 0.5,
        buzz: 5,
        date: "2024-01-15T10:30:00.000Z",
      };

      const result = validateLogEntryForm(formDataWithId);
      expect(result.success).toBe(true);
      if (result.success) {
        // The id should be stripped from the validated data
        expect(result.data).not.toHaveProperty("id");
        expect(result.data.grams).toBe(0.5);
      }
    });
  });

  describe("createLogEntry", () => {
    it("should create a valid log entry with id", () => {
      const formData = {
        grams: 0.5,
        buzz: 7,
        date: "2024-01-15T10:30:00.000Z",
      };

      const result = createLogEntry(formData);

      expect(result.id).toBeDefined();
      expect(result.grams).toBe(0.5);
      expect(result.buzz).toBe(7);
      expect(result.date).toBe("2024-01-15T10:30:00.000Z");
    });

    it("should throw error for invalid form data", () => {
      const invalidFormData = {
        grams: -1,
        buzz: 5,
        date: "2024-01-15T10:30:00.000Z",
      };

      expect(() => createLogEntry(invalidFormData)).toThrow();
    });
  });
});
