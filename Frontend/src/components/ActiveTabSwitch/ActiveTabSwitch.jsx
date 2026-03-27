import React from 'react'

function ActiveTabSwitch() {
  const { activeTab } = useChatStore();

  switch (activeTab) {
    case "chats":
      return <Chats />;

    case "users":
      return <Users />;

    case "contacts":
      return <Contacts />;

    case "settings":
      return <Settings />;

    default:
      return <Chats />;
  }
}




export default ActiveTabSwitch