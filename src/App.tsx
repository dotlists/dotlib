import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Textarea } from "./components/ui/textarea";
// types
type Color = "red" | "yellow" | "green";
type Node = { text: string; state: Color };
type List = { id: number; name: string; nodes: Node[] };

const stateOrder = { red: 0, yellow: 1, green: 2 };
const stateOrderReversed: Color[] = ["red", "yellow", "green"];


function StatusBar({ state }: { state: List }) {
  const nodes = state.nodes;
  const total = nodes.length || 1;
  const redCount = nodes.filter(n => n.state === 'red').length;
  const yellowCount = nodes.filter(n => n.state === 'yellow').length;
  const greenCount = nodes.filter(n => n.state === 'green').length;
  const redPct = (redCount / total) * 100;
  const yellowPct = (yellowCount / total) * 100;
  const greenPct = (greenCount / total) * 100;

  return (
    <div className="w-[100vw] p-3">
      <div className="rounded-b-2xl border-3 overflow-hidden">
        <div className="flex px-3 py-1">
          <h2 className="font-bold border-r-gray-200 mr-auto">{state.name}</h2>
          <h2 className="text-xl text-gray-500 mt-auto">
            {nodes.length} items
          </h2>
        </div>
        <div className="flex h-12 w-full">
          <div
            className="transition-all duration-300"
            style={{
              width: `${redPct}%`,
              backgroundColor: redCount > 0 ? '#ef4444' : 'transparent',
              transition: 'width 0.3s'
            }}
          />
          <div
            className="transition-all duration-300"
            style={{
              width: `${yellowPct}%`,
              backgroundColor: yellowCount > 0 ? '#fde047' : 'transparent',
              transition: 'width 0.3s'
            }}
          />
          <div
            className="transition-all duration-300"
            style={{
              width: `${greenPct}%`,
              backgroundColor: greenCount > 0 ? '#4ade80' : 'transparent',
              transition: 'width 0.3s'
            }}
          />
        </div>
      </div>
    </div>
  );
}
function ListEditor({
  state,
  setState,
}: {
  state: List;
  setState: (_: List) => void;
}) {
  const sortedNodes = state.nodes.slice().sort((a, b) => {
    const stateDiff = stateOrder[a.state] - stateOrder[b.state];
    if (stateDiff !== 0) return stateDiff;
    return a.text.localeCompare(b.text);
  });
  const setNode = (index: number, newNode: Node) => {
    const newNodes = [...state.nodes];
    newNodes[index] = newNode;
    setState({ ...state, nodes: newNodes });
  };
  const deleteNode = (index: number) => {
    const newNodes = [...state.nodes];
    newNodes.splice(index, 1);
    setState({ ...state, nodes: newNodes });
  };
  return (<div className="flex flex-col w-full">
    <StatusBar state={state} />
    <motion.ul layout className="h-[98vh] w-[100vw] overflow-y-scroll mt-28 fixed overflow-x-hidden">
      <AnimatePresence>
        {sortedNodes.map((node, ) => {
          const colorClass =
            node.state === "red"
              ? "bg-red-500"
              : node.state === "yellow"
                ? "bg-yellow-500"
                : "bg-green-500";
          const index = state.nodes.findIndex((n) => n == node);
          return (
            <motion.li
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex hover:bg-gray-100 w-full rounded-xl my-4 py-2"
              key={index}
            >
              <div
                onClick={() => {
                  const newState = (stateOrder[node.state] + 1) % 3;
                  setNode(index, {
                    ...node,
                    state: stateOrderReversed[newState],
                  });
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  const newState = (stateOrder[node.state] + 2) % 3;
                  setNode(index, {
                    ...node,
                    state: stateOrderReversed[newState],
                  });
                }}
                className={`w-10 min-h-[100%] mx-5 rounded-full hover:blur-xs transition-all duration-100 ${colorClass}`}
              ></div>
              <Textarea
                id={`item-${index}`}
                value={node.text}
                onChange={(e) => {
                  const newNode = { ...node, text: e.target.value };
                  setNode(index, newNode);
                }}
                className="text-xl focus:outline-none w-full focus:ring-none"
                style={{ resize: "none", overflowY: "auto"}}
                rows={1}
                ref={(el) => {
                  // This ref callback runs on mount. We can trigger the resize here.
                  if (el) {
                    el.style.height = 'auto'; // Reset height
                    el.style.height = el.scrollHeight + 'px'; // Set to content height
                  }
                }}
                onLoad={(e) => {
                  const textarea = e.currentTarget;
                  textarea.rows = null as unknown as number;
                }}
                onInput={(e) => {
                  const textarea = e.currentTarget;
                  textarea.style.height = 'auto'; // Reset height to recalculate scrollHeight
                  textarea.style.height = textarea.scrollHeight + 'px'; // Set height to match content
                }}
                onBlur={(e) => {
                  const trimmed = e.currentTarget.value.trim();
                  if (trimmed === "") {
                    deleteNode(index);
                  } else if (trimmed !== node.text) {
                    setNode(index, { ...node, text: trimmed });
                  }
                  const textarea = e.currentTarget;
                  textarea.style.height = 'auto';
                }}
                onKeyDown={(e) => {
                  if (e.key === "Backspace" && node.text === "") {
                    e.preventDefault();
                    deleteNode(index);
                  }
                }}
              />
            </motion.li>
          );
        })}
      </AnimatePresence>
    </motion.ul>
  </div>);
}

export default function App() {
  const [lists, setLists] = useState<List[]>([
    {
      id: 1,
      name: "Todo",
      nodes: [
        { text: "Can't stop thinking about if and when I die", state: "red" },
        { text: "For now I see that 'if' and 'when' are truly different cries", state: "yellow" },
        { text: "For if is purely panic and when is solemn sorrow", state: "yellow" },
        { text: "And one invades today while the other spies tomorrow", state: "green" },
        { text: "We're surrounded and we're hounded", state: "red" },
        { text: "There's no above, or under, or around it", state: "yellow" },
        { text: "For above is blind belief and under is sword to sleeve", state: "yellow" },
        { text: "And around is scientific miracle, let's pick above and see", state: "green" },
        { text: "For if and when we go above, the question still remains", state: "red" },
        { text: "Are we still in love and is it possible we feel the same?", state: "yellow" },
        { text: "And that's when going under starts to take my wonder", state: "yellow" },
        { text: "But until that time, I'll try to sing this", state: "green" },
        { text: "If I keep moving, they won't know", state: "red" },
        { text: "I'll morph to someone else", state: "yellow" },
        { text: "Defense mechanism mode", state: "green" },
        { text: "I'll morph to someone else", state: "yellow" },
        { text: "Defense mechanism mode", state: "green" },
      ],
    },
    {
      id: 2,
      name: "In Progress",
      nodes: [
        { text: "Write report", state: "yellow" },
        { text: "Fix bug #42", state: "red" },
      ],
    },
    {
      id: 3,
      name: "Done",
      nodes: [{ text: "Submit taxes", state: "green" }],
    },
  ]);
  return (
    <>
      <main className="flex">
        <ListEditor
          state={lists[0]}
          setState={(newList) => {
            setLists(
              lists.map((list) => (list.id === newList.id ? newList : list)),
            );
          }}
        />
      </main>
    </>
  );
}
