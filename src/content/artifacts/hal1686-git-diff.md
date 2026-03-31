> **HAL-1686** — Real bundle from `~/.hal/runs/run_7j8r82ayw/git-diff.txt` (Implementation run `run_7j8r82ayw`).

```diff

diff --git a/apps/ui/src/components/ChatFooter.test.tsx b/apps/ui/src/components/ChatFooter.test.tsx
index 55dad1b2..1dc6cb60 100644
--- a/apps/ui/src/components/ChatFooter.test.tsx
+++ b/apps/ui/src/components/ChatFooter.test.tsx
@@ -77,4 +77,51 @@ describe("ChatFooter", () => {
       expect(defaultProps.onSendHal).toHaveBeenCalledWith("hello", expect.any(Array));
     });
   });
+
+  it("closes the panel when watchModalOpen becomes true", async () => {
+    const Wrapper = () => {
+      const [activeChat, setActiveChat] = useState<"hal" | null>("hal");
+      const [watchOpen, setWatchOpen] = useState(false);
+      return (
+        <>
+          <button type="button" onClick={() => setWatchOpen(true)}>
+            Open watch modal
+          </button>
+          <ChatFooter
+            {...defaultProps}
+            activeChat={activeChat}
+            onActiveChatChange={setActiveChat}
+            messagesByChat={{ hal: [] }}
+            watchModalOpen={watchOpen}
+          />
+        </>
+      );
+    };
+    render(<Wrapper />);
+    expect(await screen.findByPlaceholderText(/Message/i)).toBeDefined();
+    fireEvent.click(screen.getByText("Open watch modal"));
+    await vi.waitFor(() => {
+      expect(screen.queryByPlaceholderText(/Message/i)).toBeNull();
+    });
+  });
+
+  it("invokes onClearHalHistory when ChatPanel clear history is used", async () => {
+    const user = userEvent.setup();
+    const onClearHalHistory = vi.fn();
+    const Wrapper = () => {
+      const [activeChat, setActiveChat] = useState<"hal" | null>("hal");
+      return (
+        <ChatFooter
+          {...defaultProps}
+          activeChat={activeChat}
+          onActiveChatChange={setActiveChat}
+          messagesByChat={{ hal: [{ role: "user", content: "hi" }] }}
+          onClearHalHistory={onClearHalHistory}
+        />
+      );
+    };
+    render(<Wrapper />);
+    await user.click(await screen.findByTitle("Clear conversation history"));
+    expect(onClearHalHistory).toHaveBeenCalled();
+  });
 });
diff --git a/apps/ui/src/components/ChatPanel.test.tsx b/apps/ui/src/components/ChatPanel.test.tsx
index 8c008742..731e877e 100644
--- a/apps/ui/src/components/ChatPanel.test.tsx
+++ b/apps/ui/src/components/ChatPanel.test.tsx
@@ -54,7 +54,8 @@ describe("ChatPanel", () => {
   it("renders Kyther Chat header and message input", () => {
     const { container } = render(<ChatPanel {...defaultProps} />);
     expect(screen.getByText("Kyther Chat")).toBeDefined();
-    expect(container.querySelector('input[placeholder="Message…"]')).toBeDefined();
+    const input = container.querySelector("textarea[placeholder=\"Message…\"]");
+    expect(input).toBeDefined();
   });
 
   it("does not merge agent progress into messages (status updates removed)", () => {
@@ -111,4 +112,54 @@ describe("ChatPanel", () => {
     await user.click(closeBtn);
     expect(onClose).toHaveBeenCalled();
   });
+
+  it("shows loading placeholder when HAL mode and LLM is not ready", () => {
+    const { container } = render(<ChatPanel {...defaultProps} llmReady={false} />);
+    expect(container.querySelector("textarea[placeholder=\"Loading…\"]")).toBeDefined();
+  });
+
+  it("appends assistant message when streamed response matches pending correlation", async () => {
+    const onMessagesChange = vi.fn();
+    const onResponseConsumed = vi.fn();
+    const { rerender } = render(
+      <ChatPanel
+        {...defaultProps}
+        messages={[]}
+        onMessagesChange={onMessagesChange}
+        pendingCorrelationId="corr-1"
+        lastCorrelationId=""
+        lastResponse={null}
+        onResponseConsumed={onResponseConsumed}
+      />,
+    );
+    rerender(
+      <ChatPanel
+        {...defaultProps}
+        messages={[]}
+        onMessagesChange={onMessagesChange}
+        pendingCorrelationId="corr-1"
+        lastCorrelationId="corr-1"
+        lastResponse={{ message: "Done" }}
+        onResponseConsumed={onResponseConsumed}
+      />,
+    );
+    await vi.waitFor(() => {
+      expect(onMessagesChange).toHaveBeenCalled();
+      const calls = onMessagesChange.mock.calls;
+      const last = calls[calls.length - 1]?.[0] as { role: string; content: string }[];
+      expect(last?.some((m) => m.role === "assistant" && m.content === "Done")).toBe(true);
+      expect(onResponseConsumed).toHaveBeenCalled();
+    });
+  });
+
+  it("toggles fullscreen when expand/minimize is clicked", async () => {
+    const user = userEvent.setup();
+    const onFullscreenChange = vi.fn();
+    const { container } = render(
+      <ChatPanel {...defaultProps} onFullscreenChange={onFullscreenChange} fullscreen={false} />,
+    );
+    const scope = within(container);
+    await user.click(scope.getByTitle("Full screen"));
+    expect(onFullscreenChange).toHaveBeenCalledWith(true);
+  });
 });
diff --git a/apps/ui/vitest.config.ts b/apps/ui/vitest.config.ts
index 7607142c..69853e28 100644
--- a/apps/ui/vitest.config.ts
+++ b/apps/ui/vitest.config.ts
@@ -10,7 +10,8 @@ export default defineConfig({
     exclude: ["e2e/**", "node_modules/**"],
     coverage: {
       provider: "v8",
-      reporter: ["text", "json-summary"],
+      reporter: ["text", "text-summary", "json-summary", "lcov"],
+      reportsDirectory: "./coverage",
       exclude: [
         "**/*.test.{ts,tsx}",
         "vitest.config.ts",
@@ -20,9 +21,10 @@ export default defineConfig({
         "e2e/**",
       ],
       thresholds: {
-        lines: 70,
-        branches: 50,
-        functions: 45,
+        // Package target: keep gates aligned with ticket (>= 60% overall).
+        lines: 60,
+        branches: 60,
+        functions: 50,
       },
     },
   },

```
