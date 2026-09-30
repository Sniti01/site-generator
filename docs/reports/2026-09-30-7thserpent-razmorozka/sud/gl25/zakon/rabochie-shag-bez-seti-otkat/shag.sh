git ls-remote "$GITHUB_SERVER_URL/$GITHUB_REPOSITORY" refs/heads/main > golova-main.txt 2> golova-main-oshibki.txt || echo "git ls-remote закончился ненулевым кодом" >> golova-main-oshibki.txt
node $SITE/tools/storozha-vykladki.mjs golova golova-main.txt golova-main-oshibki.txt
