"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Loader } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import Navigation from "../components/Navigation/Navigation";
import classes from "./Assistant.module.css";

export default function AssistantPage() {
  const [userQuery, setUserQuery] = useState("");
  const [systemReply, setSystemReply] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [relevantResults, setRelevantResults] = useState("");

  const handleInputChange = (e) => {
    setUserQuery(e.target.value);
  };

  const askVector = async () => {
    if (!userQuery.trim()) {
      alert("Please type a query before asking.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:5002/message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: userQuery }),
      });

      if (!response.ok) {
        throw new Error("Failed to get a response from the server.");
      }

      const data = await response.json();
      setSystemReply(data.reply);
      // Ensure that data.answer is treated as a string
      setRelevantResults(typeof data.answer === "string" ? data.answer : "");
      console.log(data.answer);
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to get a reply from Vector.");
    } finally {
      setIsLoading(false);
    }
  };

  // relevantResults is now a string, so it can be split
  const resultText = relevantResults || "";
  const resultsArray = resultText
    ? resultText.split(/Top result:|Second result:|Third result:/i)
    : [];

  const cleanedResults = resultsArray.map((result) => {
    return result
      .replace(/Text:\s*/i, "")
      .replace(/Distance:\s*\d+(\.\d+)?/i, "")
      .trim();
  });

  return (
    <motion.main
      className={classes["main-container"]}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Navigation currentPage="Assistant" />
      <div className={classes["process-container"]}>
        <motion.div
          className={classes["chat-container"]}
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <textarea
            placeholder="Type your query here..."
            className={classes.user}
            value={userQuery}
            onChange={handleInputChange}
          />
          <div className={classes.split} />
          <div className={classes.system}>
            <AnimatePresence>
              {isLoading ? (
                <motion.div
                  className={classes.loadingContainer}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Loader className={classes.loadingIcon} size={24} />
                  <p>Thinking...</p>
                </motion.div>
              ) : (
                <motion.div
                  className={classes.markdownContainer}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  {systemReply ? (
                    <div className={classes.markdown}>
                      <ReactMarkdown
                        components={{
                          h1: ({ node, ...props }) => (
                            <h1 className={classes.markdownH1} {...props} />
                          ),
                          h2: ({ node, ...props }) => (
                            <h2 className={classes.markdownH2} {...props} />
                          ),
                          h3: ({ node, ...props }) => (
                            <h3 className={classes.markdownH3} {...props} />
                          ),
                          p: ({ node, ...props }) => (
                            <p className={classes.markdownP} {...props} />
                          ),
                          ul: ({ node, ...props }) => (
                            <ul className={classes.markdownUl} {...props} />
                          ),
                          ol: ({ node, ...props }) => (
                            <ol className={classes.markdownOl} {...props} />
                          ),
                          li: ({ node, ...props }) => (
                            <li className={classes.markdownLi} {...props} />
                          ),
                          a: ({ node, ...props }) => (
                            <a className={classes.markdownA} {...props} />
                          ),
                          blockquote: ({ node, ...props }) => (
                            <blockquote
                              className={classes.markdownBlockquote}
                              {...props}
                            />
                          ),
                          code({
                            node,
                            inline,
                            className,
                            children,
                            ...props
                          }) {
                            const match = /language-(\w+)/.exec(
                              className || ""
                            );
                            return !inline && match ? (
                              <div className={classes.codeBlockWrapper}>
                                <div className={classes.codeBlockHeader}>
                                  <span>{match[1]}</span>
                                </div>
                                <SyntaxHighlighter
                                  style={vscDarkPlus}
                                  language={match[1]}
                                  PreTag="div"
                                  className={classes.codeBlock}
                                  {...props}
                                >
                                  {String(children).replace(/\n$/, "")}
                                </SyntaxHighlighter>
                              </div>
                            ) : (
                              <code className={classes.inlineCode} {...props}>
                                {children}
                              </code>
                            );
                          },
                        }}
                      >
                        {systemReply}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <p className={classes.placeholderText}>
                      System reply will appear here...
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className={classes["button-container"]}>
            <motion.button
              onClick={askVector}
              disabled={isLoading}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isLoading ? "Sending Query..." : "Ask Vector"}
              {!isLoading && <Send size={16} className={classes.sendIcon} />}
            </motion.button>
          </div>
        </motion.div>

        <motion.div
          className={classes["results-container"]}
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <h3>Top Results</h3>
          <div className={classes.resultsScroll}>
            {cleanedResults.map(
              (result, index) =>
                result && (
                  <motion.div
                    key={index}
                    className={classes.resultItem}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index, duration: 0.3 }}
                  >
                    <p>
                      <span className={classes.resultNumber}>{index}.</span>{" "}
                      {result}
                    </p>
                    <div className={classes.resultDivider} />
                  </motion.div>
                )
            )}
          </div>
        </motion.div>
      </div>
    </motion.main>
  );
}
