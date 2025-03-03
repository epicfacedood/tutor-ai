import React, { useEffect, useRef } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

interface MathRendererProps {
  math: string;
  display?: boolean;
}

const MathRenderer: React.FC<MathRendererProps> = ({
  math,
  display = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      try {
        // Clean up any potential LaTeX syntax issues
        let cleanedMath = math.trim();

        // Handle special cases for matrices and vectors
        // Sometimes backslashes might be escaped incorrectly
        cleanedMath = cleanedMath
          .replace(/\\\\begin/g, "\\begin")
          .replace(/\\\\end/g, "\\end")
          .replace(/\\\\\\/g, "\\\\");

        katex.render(cleanedMath, containerRef.current, {
          throwOnError: false,
          displayMode: display,
          fleqn: false,
          leqno: false,
          strict: false,
          trust: true,
          output: "html",
          macros: {
            // Add any custom macros here if needed
            "\\R": "\\mathbb{R}",
            "\\N": "\\mathbb{N}",
            "\\Z": "\\mathbb{Z}",
            "\\Q": "\\mathbb{Q}",
          },
        });
      } catch (error) {
        console.error("Error rendering LaTeX:", error);
        if (containerRef.current) {
          containerRef.current.textContent = math;
        }
      }
    }
  }, [math, display]);

  return (
    <div
      ref={containerRef}
      className={
        display
          ? "my-2 text-center overflow-x-auto py-1"
          : "inline-block align-middle mx-0.5"
      }
      style={display ? { minHeight: "1.5em" } : {}}
    />
  );
};

export default MathRenderer;
