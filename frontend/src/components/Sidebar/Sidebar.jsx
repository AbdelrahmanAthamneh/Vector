"use client";

import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, Database } from "lucide-react";
import classes from "./Sidebar.module.css";

function Button({ to, text, icon: Icon }) {
  return (
    <NavLink
      className={({ isActive }) =>
        isActive
          ? `${classes["button-selected"]} ${classes.button}`
          : `${classes.button} ${classes["button-unselected"]}`
      }
      to={to}
    >
      <motion.div
        className={classes.buttonContent}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Icon size={20} />
        <span>{text}</span>
      </motion.div>
    </NavLink>
  );
}

export default function Sidebar() {
  return (
    <motion.section
      className={classes.sidebar}
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className={classes["sidebar-header"]}>
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          Vector
        </motion.h1>
      </div>
      <div className={classes["button-container"]}>
        <Button to="/" icon={Sparkles} text="Assistant" />
        <Button to="/vector-store" icon={Database} text="Vectorstore" />
      </div>
    </motion.section>
  );
}
