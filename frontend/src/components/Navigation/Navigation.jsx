"use client";

import { motion } from "framer-motion";
import classes from "./Navigation.module.css";

export default function Navigation({ currentPage }) {
  return (
    <motion.nav
      className={classes.navigation}
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.3 }}
      >
        {currentPage}
      </motion.div>
    </motion.nav>
  );
}
