import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { POLICIES, POLICY_ORDER, POLICY_LAST_UPDATED, PolicyKey } from '../data/policies';
import './Policy.css';

interface PolicyProps {
  policyKey: PolicyKey;
}

const Policy: React.FC<PolicyProps> = ({ policyKey }) => {
  const policy = POLICIES[policyKey];

  // Reset scroll and keep the tab title in sync when the policy changes
  useEffect(() => {
    window.scrollTo({ top: 0 });
    if (policy) document.title = `${policy.title} | WALKERS`;
  }, [policy]);

  if (!policy) {
    return (
      <div className="policy-page">
        <div className="container">
          <h1>Policy not found</h1>
          <Link to="/" className="btn btn-primary">Back to Home</Link>
        </div>
      </div>
    );
  }

  const related = POLICY_ORDER.filter((k) => k !== policyKey);

  return (
    <div className="policy-page">
      <div className="container policy-container">
        <nav className="breadcrumb">
          <Link to="/">Home</Link>
          <span className="breadcrumb-separator">/</span>
          <span>{policy.title}</span>
        </nav>

        <header className="policy-page-header">
          <h1>{policy.title}</h1>
          <p className="policy-page-updated">Last updated: {POLICY_LAST_UPDATED}</p>
        </header>

        <article className="policy-page-body">
          {policy.sections.map((section, i) => (
            <section key={i} className="policy-page-section">
              {section.heading && <h2>{section.heading}</h2>}
              {section.paragraphs?.map((p, j) => (
                <p key={j}>{p}</p>
              ))}
              {section.bullets && (
                <ul>
                  {section.bullets.map((b, k) => (
                    <li key={k}>{b}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </article>

        <aside className="policy-related">
          <h3>Related policies</h3>
          <div className="policy-related-links">
            {related.map((k) => (
              <Link key={k} to={POLICIES[k].path} className="policy-related-link">
                {POLICIES[k].title}
              </Link>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Policy;