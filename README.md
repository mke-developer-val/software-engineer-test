# Semantic structure from heading elements and semantic-structural incongruence in web pages

## A take-home challenge for software engineers.

Please read these instructions in full before commencing the challenge.

### Background

In web pages, heading elements (`h1-h6`) are used to impose semantic structure on the content appearing in the page. They can be used to break an article into chapters or sections, with `h1` being a top-level heading, `h2` being the heading one level down and so on. In other words the semantics of the heading elements arise from the weight they carry in relation to one another. However, there is no explicit containment hierarchy between these headings. Thus, it is the responsibility of the page author or generator to use heading elements in a semantically appropriate way.

One "problem" that arises is skipping heading levels. For example, going from `h2` to `h4` without a `h3` in between. While this is also valid HTML, [it isn't best practice](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/Heading_Elements#Usage_notes).

Often, heading elements appear within the context of structural elements, such as `<div>` elements that have no real semantics attached to them, or structural elements, such as `<section>`, which *do* carry meaning within the structure of a web page. Sometimes, an incongruence or conflict emerges between the innate semantics of the heading elements and imposed semantics due to the use of nested structural elements. As the HTML Standard [notes](https://html.spec.whatwg.org/multipage/sections.html#headings-and-sections):

>Sections may contain headings of any rank, but authors are strongly encouraged to either use only h1 elements, or to use elements of the appropriate rank for the section's nesting level.

For instance, consider this simple scenario:

```
<section>
  <h2>Heading 2</h2>
  <h3>Heading 3</h3>
  <section>
    <h2>Another Heading 2</h2>
  </section>
</section>
```

This is perfectly valid HTML, but semantically, it's confused because we have a `h2` element nested at a deeper level than a `h3` element that precedes it.

These problems have a number of potential implications, including in the areas of SEO, machine translation from HTML to other formats, accessibility, automatic summarisation, and generation of tables of contents.

### Challenge

Your challenge, should you choose to accept it, is two-fold:
1. Extract the semantic structure of any web page implied by heading elements `h1-h6`. The result should be a, possibly multi-rooted, tree structure. For example, the sequence `h1`, `h2`, `h2`, `h3`, `h4`, `h2`, `h5` yields the tree `[h1, [h2, h2, [h3, [h4]], h2, [h5]]]` assuming a pre-ordered notation. Represent each heading as a node in a tree where each node consists of a tag, content and children, like `{"tag": "h1", "content": "Heading 1", "children": []`, where the list of children contains nodes of the same form. When a heading level is skipped, for example going from `h2` to `h4`, add the pair of headings on either side of the skipped levels as a tuple to an array. For this part of the task you can ignore any other elements in the page.
1. Check the extracted semantic structure against the actual containment structure of the page, adding to an array any heading element that deviates from the guideline given in the HTML spec "to either use only h1 elements, or to use elements of the appropriate rank for the section's nesting level". For example, if the above heading sequence is shown in the context of the following structure:
```
<section>
  <h1/>
  <section>
    <h2/>
    <h2/>
    <section>
      <h3/>
      <section>
        <h4/>
        <section>
          <h2/>
          <h5/>
        </section>
      </section>
    </section>
   </section>
 </section> 
```
The final `h2` element would be added to the array because the container structure puts that `h2` element in a nested position relative to the position of the `h4` element that precedes it, despite the `h2` element carrying more semantic weight. Use the same object representation as above.

Structure your code so that it can be run as a:
1. standalone command on the command line, where the URL to process is given as an argument, e.g., `checkheadings https://foo.com`
1. little web app that takes a URL as a URL parameter, e.g., `http://localhost:8000?u=https://foo.com`

In both cases, the result should be a well-formed JSON object encapsulating the outputs of the two parts of the task above. For example, given the above example, the response might look something like this:
```
{
  "semantic-structure": [
    {"tag": "h1",
      "content": "Heading 1",
      "children": [
        {"tag": "h2",
         "content": "Heading 2"
        },
        {"tag": "h2",
         "content": "Another Heading 2",
         "children": [
           {"tag": "h3",
            "content": "Heading 3",
            "children": [
              {"tag": "h4",
               "content": "Heading 4"
              }
            ]
           }
         ]
        },
        {"tag": "h2",
         "content": "An out of place Heading 2",
         "children": [
           {"tag": "h5",
            "content": "Heading 5"
           }
         ]
        }
      ]
    }
  ],
  "skipped-levels": [
    {"tag": "h2", "content": "An out of place Heading 2"}, {"tag": "h5", "content": "Heading 5"}
  ],
  "incongruent-headings": [
    {"tag": "h2", "content": "An out of place Heading 2"}
  ]
}
```

Error conditions, such as a malformed URL given as argument, should be reported appropriately for both command-line and web API invocations.

Add a description of your approach to the bottom of this README, including a note about the computation complexity of your solution. Your description should also include instructions for running your solution in web app and command line form.

### Notes

1. You may assume web pages are static. That is, you do not need to evaluate inline or referenced javascript before processing the page, though you might like to briefly comment on how you'd modify your solution to support single-page websites and other dynamically generated pages.
1. For the second part of the challenge, you may assume that structural elements are restricted to `div` and [sectioning content](https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/Content_categories#Sectioning_content).
1. Tests are desirable.
1. You may use any language, libraries, frameworks that you wish, but please ensure you've documented clearly how to install anything that's required to run your solution.
1. We would not expect you to spend more than four hours completing this challenge.
1. If you need any of the requirements to be clarified, please just ask!

### Criteria

Assuming that you submit a "correct" solution, we are then first and foremost interested to see *how* you solve the problem. That is our top criterion below.

1. Elegance/simplicity of your solution
1. Elegance/readability of your code (note: this is very distinct from the first criterion!)
1. Documentation and comments

### Submitting your solution

Clone this repo and create a new, private repository to use as the remote origin.

Create your solution there and, when it's ready, add @ckortekaas to your fork, and let us know that you've completed the challenge.

---

Your comments go here.

# Heading Checker

A serverless application that analyzes the semantic structure of headings (h1-h6) in web pages, detects skipped heading levels, and identifies incongruent heading structures based on DOM nesting.

## Features

- Analyzes HTML heading hierarchy (h1-h6)
- Detects skipped heading levels (e.g., h2 → h5)
- Identifies headings that conflict with DOM structure
- RESTful API backend (AWS Lambda + API Gateway)
- React frontend with JSON viewer
- Fully serverless AWS architecture

## Architecture

- **Backend**: Node.js 20 Lambda function (TypeScript)
- **API**: REST API via API Gateway
- **Frontend**: React application hosted on S3
- **Infrastructure**: AWS SAM (Serverless Application Model)

## Prerequisites

- [AWS CLI](https://aws.amazon.com/cli/) configured with credentials
- [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html)
- [Node.js](https://nodejs.org/) 20 or higher
- npm

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd heading-checker
   ```

2. **Configure AWS credentials**
   ```bash
   aws configure
   ```
   Enter your AWS Access Key, Secret Key, and preferred region.

## Deployment

Deploy the entire application (backend + frontend) with one command:

```bash
./deploy.sh
```

**What this does:**
1. Installs backend dependencies
2. Builds and deploys Lambda function + API Gateway
3. Builds React frontend with API URL
4. Uploads frontend to S3

**After deployment**, you'll see:
```
Website URL: http://bucket-name.s3-website-region.amazonaws.com
```

### Custom Stack Name or Region

```bash
./deploy.sh my-stack-name us-west-2
```

## Using the Application

### Web Interface

1. Open the Website URL in your browser
2. Enter a URL to analyze (e.g., `https://example.com`)
3. Click "Analyze"
4. View the JSON results

## Local Development

### Run Backend Locally

```bash
# Install dependencies
cd backend
npm install

# Run tests
npm test

# Start local API
cd ..
sam local start-api
```

The API will be available at `http://localhost:3000/analyze`

### Run Frontend Locally

```bash
# Install dependencies (use --legacy-peer-deps due to React 18 compatibility)
cd frontend
npm install --legacy-peer-deps

# Create .env with API URL
echo "VITE_API_URL=http://localhost:3000" > .env

# Start dev server
npm run dev
```

The frontend will be available at `http://localhost:5173`

## Deleting the Stack

Remove all AWS resources:

```bash
./cleanup.sh
```
