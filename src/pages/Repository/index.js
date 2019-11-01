import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import api from '../../services/api';

import Container from '../../components/Container';
import { Loading, Owner, IssuesList, ButtonGroup, Pagination } from './styles';

export default class Repository extends Component {
  static propTypes = {
    match: PropTypes.shape({
      params: PropTypes.shape({
        repository: PropTypes.string,
      }),
    }).isRequired,
  };

  state = {
    repository: {},
    issues: [],
    loading: true,
    issueByStatus: 'all',
    page: 1,
  };

  async componentDidMount() {
    const { match } = this.props;
    const { issueByStatus } = this.state;

    const repoName = decodeURIComponent(match.params.repository);

    const [repository, issues] = await Promise.all([
      api.get(`/repos/${repoName}`),
      api.get(`/repos/${repoName}/issues`, {
        params: {
          state: issueByStatus,
          per_page: 5,
        },
      }),
    ]);

    this.setState({
      repository: repository.data,
      issues: issues.data,
      loading: false,
      issueByStatus,
    });
  }

  onSetIssue = async scale => {
    await this.setState({ issueByStatus: scale });
    this.filterIssue();
  };

  filterIssue = async (page = 1) => {
    const { match } = this.props;
    const { issueByStatus } = this.state;

    const repoName = decodeURIComponent(match.params.repository);

    const response = await api.get(`/repos/${repoName}/issues`, {
      params: {
        state: issueByStatus,
        per_page: 5,
        page,
      },
    });

    this.setState({
      issues: response.data,
    });
  };

  nextPage = () => {
    const { page, issues } = this.state;

    const pageNumber = page + 1;

    if (issues.length === 0) return;

    this.setState({ page: pageNumber });

    this.filterIssue(pageNumber);
  };

  prevPage = () => {
    const { page } = this.state;

    const pageNumber = page - 1;

    if (page <= 1) return;

    this.setState({ page: pageNumber });

    this.filterIssue(pageNumber);
  };

  render() {
    const { repository, issues, loading, issueByStatus, page } = this.state;

    if (loading) {
      return <Loading>Loading</Loading>;
    }

    return (
      <Container>
        <Owner>
          <Link to="/">Back to repositories</Link>
          <img src={repository.owner.avatar_url} alt={repository.owner.login} />
          <h1>{repository.name}</h1>
          <p>{repository.description}</p>
        </Owner>

        <ButtonGroup>
          {['all', 'open', 'closed'].map(scale => {
            return (
              <button
                type="button"
                key={scale}
                aria-pressed={scale === issueByStatus}
                onClick={() => this.onSetIssue(scale)}
              >
                {scale}
              </button>
            );
          })}
        </ButtonGroup>

        <IssuesList>
          {issues.map(issue => (
            <li key={String(issue.id)}>
              <img src={issue.user.avatar_url} alt={issue.user.login} />
              <div>
                <strong>
                  <a href={issue.html_url}>{issue.title}</a>
                  {issue.labels.map(label => (
                    <span key={String(label.id)}>{label.name}</span>
                  ))}
                </strong>
                <p>{issue.user.login}</p>
              </div>
            </li>
          ))}
        </IssuesList>

        <Pagination>
          <button type="button" disabled={page <= 1} onClick={this.prevPage}>
            Prev
          </button>
          <p>
            <strong>Page {page}</strong>
          </p>
          <button
            type="button"
            disabled={issues.length === 0}
            onClick={this.nextPage}
          >
            Next
          </button>
        </Pagination>
      </Container>
    );
  }
}
