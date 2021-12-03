import React, { useState, useEffect, useContext } from 'react';
import mockUser from './mockData.js/mockUser';
import mockRepos from './mockData.js/mockRepos';
import mockFollowers from './mockData.js/mockFollowers';
import axios from 'axios';

const rootUrl = 'https://api.github.com';

const AppContext = React.createContext();

const GithubProvider = ({ children }) => {
  const [githubUser, setGithubUser] = useState(mockUser);
  const [repos, setRepos] = useState(mockRepos);
  const [followers, setFollowers] = useState(mockFollowers);
  //requests
  const [requests, setRequests] = useState({ limit: 0, remaining: 0 });
  const [isLoading, setIsLoading] = useState(false);
  //Error
  const [error, setError] = useState({ show: false, msg: '' });

  const getUser = async (user) => {
    displayError();
    setIsLoading(true);
    const response = await axios(`${rootUrl}/users/${user}`).catch((err) =>
      console.log(err)
    );
    if (response) {
      setGithubUser(response.data);
      //repos
      const { login, followers_url } = response.data;
      //followers
      await Promise.allSettled([
        axios(`${rootUrl}/users/${login}/repos?per_page=100`),
        axios(`${followers_url}?per_page=100`),
      ])
        .then((data) => {
          const [repos, followers] = data;
          if (repos.status === 'fulfilled') {
            setRepos(repos.value.data);
          }
          if (followers.status === 'fulfilled') {
            setFollowers(followers.value.data);
          }
        })
        .catch((err) => console.log(err));
    } else {
      displayError(true, 'There is no user with this username');
    }
    checkRequest();
    setIsLoading(false);
  };

  const checkRequest = () => {
    axios(`${rootUrl}/rate_limit`)
      .then(({ data }) => {
        let {
          rate: { limit, remaining },
        } = data;
        if (remaining === 0) {
          displayError(true, 'You have run out of requests per hour!!!');
        }
        setRequests({ ...requests, limit, remaining });
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const displayError = (show = false, msg = '') => {
    setError({ show, msg });
  };

  useEffect(checkRequest, []);
  return (
    <AppContext.Provider
      value={{
        githubUser,
        repos,
        followers,
        requests,
        error,
        getUser,
        isLoading,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useGlobalContext = () => {
  return React.useContext(AppContext);
};

export { GithubProvider };
