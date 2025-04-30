"use client";

import { motion } from "framer-motion";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar/Sidebar";
import classes from "./RootLayout.module.css";

export default function RootLayout() {
  return (
    <div className={classes.layout}>
      <Sidebar />
      <motion.div
        className={classes.content}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Outlet />
      </motion.div>
    </div>
  );
}
