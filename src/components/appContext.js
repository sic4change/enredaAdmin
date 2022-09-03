import React, { useState } from 'react';

export const AppContext = React.createContext();

export const AppContextProvider = ({children}) => {

  const [globalMessage, setGobalMessage] = useState('');

  //const storeCurrentCourse = currentCourse => setCurrentCourse(currentCourse);

  const context = {
    globalMessage,
    setGobalMessage
  }

  return <AppContext.Provider value={context}>{children}</AppContext.Provider>
}
