# Vite RFC

## What is an RFC?

The "RFC" (request for comments) process is intended to provide a consistent and controlled path for new features to enter the framework.

Many changes, including bug fixes and documentation improvements can be implemented and reviewed via the normal GitHub pull request workflow.

Some changes though are "substantial", and we ask that these be put through a bit of a design process and produce a consensus among the Vite core team and the community.

## The RFC life-cycle

An RFC goes through the following stages:

- **Proposed:** when an RFC discussion is created and active for collecting feedback.
- **Accepted:** when an RFC is accepted by the team.
- **Rejected:** when an RFC is considered rejected after team discussion.

[Active RFC List](https://github.com/vitejs/vite/discussions?discussions_q=label%3A%22rfc%3A+active%22)

## When to follow this process

What constitutes a "substantial" change is evolving based on community norms, but may include the following:

- A new feature that creates new API surface area
- Changing the semantics or behavior of an existing API
- The removal of features that are already shipped as part of the release channel.
- The introduction of new idiomatic usage or conventions, even if they do not include code changes to Vue itself.

Some changes do not require an RFC:

- Additions that strictly improve objective, numerical quality criteria (speedup, better browser support)
- Fixing objectively incorrect behavior
- Rephrasing, reorganizing or refactoring
- Addition or removal of warnings
- Additions only likely to be _noticed by_ other implementors-of-Vite, invisible to users-of-Vite.

## Why do you need to do this

It is great that you are considering suggesting new features or changes to Vite - we appreciate your willingness to contribute! However, as Vite becomes more widely used, we need to take stability more seriously, and thus have to carefully consider the impact of every change we make that may affect end users. On the other hand, we also feel that Vite has reached a stage where we want to start consciously preventing further complexity from new API surfaces.

These constraints and tradeoffs may not be immediately obvious to users who are proposing a change just to solve a specific problem they just ran into. The RFC process serves as a way to guide you through our thought process when making changes to Vue, so that we can be on the same page when discussing why or why not these changes should be made.

## Gathering feedback before submitting

It's often helpful to get feedback on your concept before diving into the level of API design detail required for an RFC. **You may open an issue on this repo to start a high-level discussion**, with the goal of eventually formulating an RFC pull request with the specific implementation design.

## What the process is

In short, to get a major feature added to Vite, one must first get the RFC merged into the RFC repo as a markdown file. At that point the RFC is accepted and may be implemented with the goal of eventual inclusion into Vite.

1.  Work on your proposal based on the template [`rfcs/0000-template.md`]() found in this repo.

    - Put care into the details: **RFCs that do not present convincing motivation, demonstrate understanding of the impact of the design, or are disingenuous about the drawbacks or alternatives tend to be poorly-received**.

2.  Open a new thread in [Discussions](https://github.com/vitejs/vite/discussions) and make sure to set category to "RFC Discussions".

    - Build consensus and integrate feedback in the discussion thread. RFCs that have broad support are much more likely to make progress than those that don't receive any comments.

3.  If the proposal receives non-trivial interest from community members and generally positive feedback, you can prepare a Pull Request:

    - Fork the Vite Core repo.
    - Create your proposal as `rfcs/0000-my-feature.md` (where "my-feature" is descriptive. don't assign an RFC number yet).
    - Submit a pull request. Make sure to link to the discussion thread.

4.  Eventually, the [core team](https://vitejs.dev/team.html) will decide whether the RFC is a candidate for inclusion in Vite.

    - An RFC can be modified based upon feedback from the [core team](https://vitejs.dev/team.html) and community. Significant modifications may trigger a new final comment period.
    - An RFC may be rejected after public discussion has settled and comments have been made summarizing the rationale for rejection. A member of the [core team] should then mark the RFC as `rejected`.
    - An RFC may be accepted at the close of its final comment period. A [core team] member will merge the RFC's associated pull request, at which point the RFC will become 'accepted'.

## Rationale for using both a Discussion and a PR for the RFC process

Even if there is more complexity with having both a PR and a Discussion, there are many benefits:

- The RFC PR is needed to add the final version to the `rfcs` folder.
- It lets the RFC author work with their setup to create and edit the RFC instead of the GitHub discussion UI.
- Git history of editions which is better than the discussion comment history.
- Review tools over the RFC text (commenting on a line, include a suggestion to fix a typo or a bug in an example). We can then move noisy comments unrelated to the RFC design discussion to the PR.
- Ability to add the PR to milestones and it to the [Team Board](https://github.com/orgs/vitejs/projects/1) when it is ready for acceptance review.

> **Note**
> It is important for the RFC author and contributors to use the RFC PR review tools only to improve the RFC text (typos, bugs in code examples, clarity of an explanation). All design and trade-off discussions must happen in the RFC Discussion.

## Details on Accepted RFCs

Once an RFC becomes accepted then authors may implement it and submit the feature as a pull request to the Vue repo. Becoming accepted is not a rubber stamp, and in particular still does not mean the feature will ultimately be merged; it does mean that the core team has agreed to it in principle and are amenable to merging it.

Furthermore, the fact that a given RFC has been accepted implies nothing about what priority is assigned to its implementation, nor whether anybody is currently working on it.

Modifications to active RFC's can be done in followup PR's. We strive to write each RFC in a manner that it will reflect the final design of the feature; but the nature of the process means that we cannot expect every merged RFC to actually reflect what the end result will be at the time of the next major release; therefore we try to keep each RFC document somewhat in sync with the language feature as planned, tracking such changes via followup pull requests to the document.

## Implementing an RFC

The author of an RFC is not obligated to implement it. Of course, the
RFC author (like any other developer) is welcome to post an
implementation for review after the RFC has been accepted.

An RFC should have the link to the implementation PR listed if there is one. Feedback to the actual implementation should be conducted in the implementation PR instead of the original RFC PR.

If you are interested in working on the implementation for an accepted RFC, but cannot determine if someone else is already working on it, feel free to ask (e.g. by leaving a comment on the associated issue).

## Reviewing RFC's

Members of the [core team] will attempt to review some set of open RFC discussions on a regular basis. When a RFC has collected enough feedback and made corresponding revise, the [core team] will bring it up to the internal team meeting and then update the RFC's stage.

**Vite's RFC process owes its inspiration to the [Vue RFC process], [React RFC process], [Rust RFC process] and [Ember RFC process]**

[vue rfc process]: https://github.com/vuejs/rfcs
[react rfc process]: https://github.com/reactjs/rfcs
[rust rfc process]: https://github.com/rust-lang/rfcs
[ember rfc process]: https://github.com/emberjs/rfcs
[core team]: https://vitejs.dev/team.html
