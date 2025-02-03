import React from "react";
import user from "./assets/user.png"

export default function({children, timeStamp, isUser, ...props}){
    return (
        <div className="message">
            <time>
                {timeStamp}
            </time>
            <div>
                <img src={isUser ? user : ai} alt="profile picture"/>
                <p>{children}</p>
            </div>
        </div>
    )
}