import { describe, expect, it } from "bun:test";
import { STATUS_FLOW_MAP } from "../flow.constants";

describe("flow constants", () => {
  describe("STATUS_FLOW_MAP", () => {
    it("maps all 12 statuses", () => {
      expect(Object.keys(STATUS_FLOW_MAP)).toHaveLength(12);
    });

    it("maps Active statuses correctly", () => {
      expect(STATUS_FLOW_MAP["In Progress"]).toBe("Active");
      expect(STATUS_FLOW_MAP["Review and Build"]).toBe("Active");
      expect(STATUS_FLOW_MAP["Testing"]).toBe("Active");
      expect(STATUS_FLOW_MAP["In RC"]).toBe("Active");
    });

    it("maps Queue statuses correctly", () => {
      expect(STATUS_FLOW_MAP["Open"]).toBe("Queue");
      expect(STATUS_FLOW_MAP["Blocked"]).toBe("Queue");
      expect(STATUS_FLOW_MAP["Ready For Test"]).toBe("Queue");
      expect(STATUS_FLOW_MAP["Ready To Merge"]).toBe("Queue");
      expect(STATUS_FLOW_MAP["Ready to RC"]).toBe("Queue");
    });

    it("maps Done statuses correctly", () => {
      expect(STATUS_FLOW_MAP["Done"]).toBe("Done");
      expect(STATUS_FLOW_MAP["Canceled"]).toBe("Done");
    });

    it("maps Need Rework to Rework phase", () => {
      expect(STATUS_FLOW_MAP["Need Rework"]).toBe("Rework");
    });
  });
});
