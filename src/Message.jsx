import React from "react";
import user from "./assets/user.png"

export default function({children, timeStamp, isUser, ...props}){
    return (
        <div className="message">
            <time className="crono-stamp">
                {timeStamp}
            </time>
            <div className={`${isUser ? "user-message" : "ai-message"}`}>
                <img className="profile-pic" src={isUser ? user : ai} alt="profile picture"/>
                <p>{children}</p>
            </div>
        </div>
    )
}