import React from "react";
import axios from "axios";
import PropTypes from "prop-types";
import GroupAbout from "./GroupAbout";
import GroupHeader from "./GroupHeader";
import Card from "./CardWithLink";
import withLanguage from "./LanguageContext";
import Texts from "../Constants/Texts";
import ConfirmDialog from "./ConfirmDialog";
import LoadingSpinner from "./LoadingSpinner";
import Log from "./Log";

class GroupInfo extends React.Component {
  constructor(props) {
    super(props);
    this.state = { group: this.props.group, fetchedGroupInfo: false };
  }

  componentDidMount() {
    const groupId = this.state.group.group_id;
    axios
      .get(`/api/groups/${groupId}/settings`)
      .then(response => {
        const { group } = this.state;
        group.settings = response.data;
        let group_accepted = false;
        let user_accepted = false;
        let userIsAdmin = false;
        const userId = JSON.parse(localStorage.getItem("user")).id;
        group.members.forEach(member => {
          if (member.user_id === userId) {
            group_accepted = member.group_accepted;
            user_accepted = member.user_accepted;
            userIsAdmin = member.admin;
          }
        });
        this.setState({
          group_accepted,
          user_accepted,
          userIsAdmin,
          confirmIsOpen: false,
          fetchedGroupInfo: true,
          group
        });
      })
      .catch(error => {
        Log.error(error);
      });
  }

  handleAcceptInvite = () => {
    const userId = JSON.parse(localStorage.getItem("user")).id;
    const groupId = this.state.group.group_id;
    axios
      .patch(`/api/users/${userId}/groups/${groupId}`, {
        patch: { user_accepted: true }
      })
      .then(response => {
        Log.info(response);
        this.setState({ user_accepted: true });
        this.props.enableNavigation();
      })
      .catch(error => {
        Log.error(error);
      });
  };

  handleJoin = () => {
    const userId = JSON.parse(localStorage.getItem("user")).id;
    axios
      .post(`/api/users/${userId}/groups`, {
        group_id: this.state.group.group_id
      })
      .then(response => {
        Log.info(response);
        this.setState({ user_accepted: true });
      })
      .catch(error => {
        Log.error(error);
      });
  };

  handleLeave = () => {
    const userId = JSON.parse(localStorage.getItem("user")).id;
    const groupId = this.state.group.group_id;
    axios
      .delete(`/api/users/${userId}/groups/${groupId}`)
      .then(response => {
        Log.info(response);
        this.props.history.replace("/myfamiliesshare");
      })
      .catch(error => {
        Log.error(error);
      });
  };

  handleCancel = () => {
    const userId = JSON.parse(localStorage.getItem("user")).id;
    const groupId = this.state.group.group_id;
    axios
      .delete(`/api/users/${userId}/groups/${groupId}`)
      .then(response => {
        Log.info(response);
        this.setState({ user_accepted: false });
      })
      .catch(error => {
        Log.error(error);
      });
  };

  handleConfirmClose = choice => {
    if (choice === "agree") {
      this.handleLeave();
    }
    this.setState({ confirmIsOpen: false });
  };

  renderJoinButton = () => {
    const texts = Texts[this.props.language].groupInfo;
    const { group_accepted } = this.state;
    const { user_accepted } = this.state;
    const groupIsOpen = this.state.group.settings.open;
    let disabled = false;
    let text;
    let handleFunc;
    if (user_accepted) {
      if (group_accepted) {
        text = texts.leave;
        handleFunc = () => {
          this.setState({ confirmIsOpen: true });
        };
      } else {
        text = texts.pending;
        handleFunc = this.handleCancel;
      }
    } else if (group_accepted) {
      text = texts.join;
      handleFunc = this.handleAcceptInvite;
    } else if (groupIsOpen) {
      text = texts.join;
      handleFunc = this.handleJoin;
    } else {
      disabled = true;
    }
    return !disabled ? (
      <button onClick={handleFunc} className="joinGroupButton">
        {text}
      </button>
    ) : null;
  };

  render() {
    const texts = Texts[this.props.language].groupInfo;
    return this.state.fetchedGroupInfo ? (
      <div id="groupInfoContainer">
        <GroupHeader
          groupName={this.state.group.name}
          groupId={this.props.group.group_id}
          groupLogo={this.state.group.image.path}
          groupBackground={this.state.group.background}
          userIsAdmin={this.state.userIsAdmin}
        />
        <div id="groupInfoMainContainer">
          <GroupAbout
            groupInfo={this.state.group.description}
            hasJoined={this.state.group_accepted && this.state.user_accepted}
          />
          {this.state.user_accepted && this.state.group_accepted && (
            <Card
              card={{
                cardHeader: texts.startGuideHeader,
                cardInfo: texts.startGuideInfo,
                learnMore: true,
                link: `${this.props.match.url}/start-up-guide`
              }}
            />
          )}
          {this.renderJoinButton()}
          <ConfirmDialog
            isOpen={this.state.confirmIsOpen}
            title={texts.confirm}
            handleClose={this.handleConfirmClose}
          />
        </div>
      </div>
    ) : (
      <LoadingSpinner />
    );
  }
}
export default withLanguage(GroupInfo);

GroupInfo.propTypes = {
  enableNavigation: PropTypes.func,
  group: PropTypes.object
};
