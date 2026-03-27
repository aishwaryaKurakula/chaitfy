import useChatStore from "../../store/useChatStore";

function ActiveTabSwitch() {
  const { activeTab } = useChatStore();

  return (
    <div className="active-tab-switch" data-active-tab={activeTab}>
      {activeTab}
    </div>
  );
}

export default ActiveTabSwitch;
