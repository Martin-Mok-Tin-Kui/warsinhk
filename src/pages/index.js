import React from "react"
import { useTranslation } from "react-i18next"
import { graphql, Link as InternalLink } from "gatsby"
import styled from "styled-components"
import { useMediaQuery } from "react-responsive"

import { bps } from "@/ui/theme"
import Box from "@material-ui/core/Box"
import Typography from "@material-ui/core/Typography"
import Link from "@material-ui/core/Link"
import Button from "@material-ui/core/Button"
import { getLocalizedPath } from "../utils/i18n"

import SEO from "@components/templates/SEO"
import Layout from "@components/templates/Layout"
import { BasicCard } from "@components/atoms/Card"
import { WarsCaseCard } from "@components/organisms/CaseCard"
import AlertMessage from "@components/organisms/AlertMessage"
import OutboundAlert from "@components/charts/OutboundAlert"
import { Paragraph } from "@components/atoms/Text"
import Grid from "@material-ui/core/Grid"
import { trackCustomEvent } from "gatsby-plugin-google-analytics"

import { isSSR, formatNumber } from "@/utils"
import { SessionWrapper, SplitWrapper } from "@components/atoms/Container"
import EpidemicChart from "@/components/charts/StackedBarChart"

import ImageZh1 from "@/images/banner/zh/dummies.png"
import ImageZh2 from "@/images/banner/zh/searcher.png"
import ImageZh3 from "@/images/banner/zh/apple.png"
import ImageZh4 from "@/images/banner/zh/world.png"
import ImageEn1 from "@/images/banner/en/searcher.png"
import ImageEn2 from "@/images/banner/en/world.png"
// import ImageEn3 from "@/images/banner/en/apple.png"
// lazy-load the chart to avoid SSR
const ConfirmedCaseVisual = React.lazy(() =>
  import(
    /* webpackPrefetch: true */ "@/components/organisms/ConfirmedCaseVisual"
  )
)

const Carousel = React.lazy(() =>
  import(/* webpackPrefetch: true */ "@components/atoms/Carousel")
)

const IndexAlertMessage = styled(AlertMessage)`
  ${bps.up("lg")} {
    > * {
      flex: 1 0 100%;
      margin-right: 0;
    }
  }
`
const DailyStatsContainer = styled(Box)`
  display: flex;
  justify-content: space-between;
`

const DailyStat = styled(Box)`
  display: flex;
  flex-direction: column;
  align-items: center;
`
const DailyStatFigureLabel = styled(Typography)`
  text-align: center;
  font-size: ${props => props.theme.typography.xsmallFontSize};

  ${bps.down("sm")} {
    font-size: 11px;
  }
`

const DailyStatFigure = styled(Typography)`
  font-size: 25px;
  font-weight: 700;
`

const PassengerDailyStatFigure = styled(Typography)`
  font-size: 20px;
  font-weight: 700;
`

const DailyChange = styled(({ badSign, children, ...props }) => (
  <Typography {...props}>{children}</Typography>
))`
  font-size: 14px;
  font-weight: 700;
  color: ${props => {
    return props.badSign
      ? props.theme.palette.secondary.dark
      : props.theme.palette.trafficLight.green
  }};
`

const FullWidthButton = styled(Button)`
  width: 100%;
  padding: 6px 10px;
`

const FriendlyLinksContainer = styled(Box)`
  margin-bottom: 16px;
`
const CarouselContainer = styled.div`
  margin: 16px 0;
`

const CarouselCell = styled.img`
  width: 66%;
  max-width: 220px;
  height: 120px;
  margin-right: 12px;
`

function DailyStats({
  t,
  botdata: [{ node: first }, { node: second }],
  overridedata,
}) {
  let today, ytd

  today = {
    ...first,
    confirmed: Math.max(overridedata.confirmed, first.confirmed),
    discharged: Math.max(overridedata.discharged, first.discharged),
    death: Math.max(overridedata.death, first.death),
  }

  if (
    overridedata.date > first.date &&
    (overridedata.confirmed > first.confirmed ||
      overridedata.discharged > first.discharged ||
      overridedata.death > first.death)
  ) {
    ytd = {
      ...first,
    }
  } else {
    ytd = {
      ...second,
    }
  }

  const dataArray = [
    {
      label: t("dashboard.death"),
      today_stat: today.death || 0,
      diff: today.death - ytd.death,
    },
    {
      label: t("dashboard.discharged"),
      today_stat: today.discharged || 0,
      diff: today.discharged - ytd.discharged,
    },
    {
      label: t("dashboard.confirmed"),
      today_stat: today.confirmed,
      diff: today.confirmed - ytd.confirmed,
    },
    {
      label: t("dashboard.investigating"),
      today_stat: today.investigating,
      diff: today.investigating - ytd.investigating,
    },
    {
      label: t("dashboard.reported"),
      today_stat: today.reported,
      diff: today.reported - ytd.reported,
    },
  ]

  return (
    <DailyStatsContainer>
      {dataArray.map((d, i) => (
        <DailyStat key={i}>
          <DailyStatFigureLabel>{d.label}</DailyStatFigureLabel>
          <DailyStatFigure>{formatNumber(d.today_stat)}</DailyStatFigure>
          <DailyChange
            badSign={d.label === t("dashboard.discharged") ? false : d.diff > 0}
          >
            {d.diff > 0
              ? `▲ ${formatNumber(d.diff)}`
              : d.diff < 0
              ? `▼ ${formatNumber(Math.abs(d.diff))}`
              : `-`}
          </DailyChange>
        </DailyStat>
      ))}
    </DailyStatsContainer>
  )
}

function PassengerStats({
  t,
  bay: [{ node: bay_today }, { node: bay_ytd }],
  bridge: [{ node: bridge_today }, { node: bridge_ytd }],
  airport: [{ node: airport_today }, { node: airport_ytd }],
  total: [{ node: total_today }, { node: total_ytd }],
}) {
  const dataArray = [
    {
      label: t("dashboard.airport"),
      today_stat: airport_today.arrival_total,
      diff: airport_today.arrival_total - airport_ytd.arrival_total,
    },
    {
      label: t("dashboard.bay"),
      today_stat: bay_today.arrival_total || 0,
      diff: bay_today.arrival_total - bay_ytd.arrival_total,
    },
    {
      label: t("dashboard.bridge"),
      today_stat: bridge_today.arrival_total,
      diff: bridge_today.arrival_total - bridge_ytd.arrival_total,
    },
    {
      label: t("dashboard.total"),
      today_stat: total_today.arrival_total,
      diff: total_today.arrival_total - total_ytd.arrival_total,
    },
  ]

  return (
    <DailyStatsContainer>
      {dataArray.map((d, i) => (
        <DailyStat key={i}>
          <DailyStatFigureLabel>{d.label}</DailyStatFigureLabel>
          <PassengerDailyStatFigure>
            {formatNumber(d.today_stat)}
          </PassengerDailyStatFigure>
          <DailyChange badSign={d.diff > 0}>
            {d.diff > 0
              ? `▲ ${formatNumber(d.diff)}`
              : d.diff < 0
              ? `▼ ${formatNumber(Math.abs(d.diff))}`
              : `-`}
          </DailyChange>
        </DailyStat>
      ))}
    </DailyStatsContainer>
  )
}

function epidemicCurve(allWarsCase) {
  const listDate = [];
  const startDate = "2020-01-18"
  const date1 = new Date(startDate)
  const date2 = new Date()
  const diffTime = Math.abs(date2 - date1);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  const dateMove = new Date(startDate)
  const strDate = startDate;
  let d = startDate
  let k = diffDays
  while (k > 0){
    d = dateMove.toISOString().slice(0,10)
    console.log(d)
    listDate.push(d)
    dateMove.setDate(dateMove.getDate()+1)
    k--
  }

  const { t } = useTranslation()
  const transformedInitialData = listDate.reduce((result, d) => {
    result[d] = {
      imported: 0, 
      imported_close_contact:0, 
      local_possibly: 0,
      local: 0,
      local_close_contact: 0,
      local_possibly_close_contact: 0,
      label: d
    }
    return result
  },{})
  const transformedData = allWarsCase.edges.reduce((result, {node}) => {
    if (node.classification != "-" && node.onset_date.toLowerCase() != "asymptomatic") {
      result[node.onset_date][node.classification]++
    }
    return result
  }, transformedInitialData)
  return (
    <div>
      <SEO title="Charts" />
      <EpidemicChart
        keys={[
          "imported",
          "imported_close_contact",
          "local",
          "local_close_contact",
          "local_possibly",
          "local_possibly_close_contact"
        ]}
        keyToLabel={key => {
          return t(`epidemic_chart.key_${key}`)
        }}
        data={Object.values(transformedData)}
      />
    </div>
  )

}

export default function IndexPage({ data }) {
  const { i18n, t } = useTranslation()

  const isMobile = useMediaQuery({ maxWidth: 960 })

  const latestFigures = React.useMemo(
    () => data.allBotWarsLatestFigures.edges[0].node,
    [data]
  )

  const latestFiguresOverride = React.useMemo(
    () => data.allWarsLatestFiguresOverride.edges[0].node,
    [data]
  )

  const latestCases = data.allWarsCase.edges
    .sort((a, b) => parseInt(b.node.case_no) - parseInt(a.node.case_no))
    .filter(
      c =>
        c.node.confirmation_date ===
        data.allWarsCase.edges[0].node.confirmation_date
    )

  const bannerImages = {
    zh: [
      { img: ImageZh1, isExternal: true, url: "https://bit.ly/wars1001" },
      { img: ImageZh2, isExternal: true, url: "http://bit.ly/2x7PctV" },
      { img: ImageZh3, isExternal: true, url: "http://bit.ly/3cLtKeL" },
      { img: ImageZh4, isExternal: false, url: "https://wars.vote4.hk/world" },
    ],
    en: [
      { img: ImageEn1, isExternal: true, url: "http://bit.ly/2x7PctV" },
      {
        img: ImageEn2,
        isExternal: false,
        url: "https://wars.vote4.hk/en/world",
      },
    ],
  }

  const bannerImagesArray =
    bannerImages[i18n.language].length < 4
      ? [...bannerImages[i18n.language], ...bannerImages[i18n.language]]
      : bannerImages[i18n.language]

  return (
    <>
      <SEO title="Home" />
      <Layout>
        <SplitWrapper>
          <SessionWrapper>
            <IndexAlertMessage />
            <Typography variant="h2">{t("index.title")}</Typography>
            <Typography variant="body2">
              <Link
                href="https://www.chp.gov.hk/tc/features/102465.html"
                target="_blank"
              >
                {t("dashboard.source_chpgovhk")}
              </Link>
            </Typography>
            <Typography variant="body2" color="textPrimary">
              {`${t("dashboard.last_updated")}${
                latestFiguresOverride.date > latestFigures.date
                  ? latestFiguresOverride.date
                  : latestFigures.date
              }`}
            </Typography>
            <BasicCard>
              <DailyStats
                t={t}
                botdata={data.allBotWarsLatestFigures.edges}
                overridedata={latestFiguresOverride}
              />
            </BasicCard>
            {!isSSR() && (
              <React.Suspense fallback={<div />}>
                <CarouselContainer>
                  <Carousel
                    options={{
                      autoPlay: false,
                      wrapAround: true,
                      adaptiveHeight: false,
                      prevNextButtons: isMobile ? false : true,
                      pageDots: false,
                    }}
                  >
                    {bannerImagesArray.map((b, index) => (
                      <CarouselCell
                        key={index}
                        onClick={() => {
                          trackCustomEvent({
                            category: "carousel_banner",
                            action: "click",
                            label: b.url,
                          })
                          window.open(b.url, b.isExternal ? "_blank" : "_self")
                        }}
                        src={b.img}
                        alt=""
                      />
                    ))}
                  </Carousel>
                </CarouselContainer>
              </React.Suspense>
            )}
            {isMobile && (
              <Typography variant="h2">{t("index.highlight")}</Typography>
            )}
            {isMobile && !isSSR() && (
              <React.Suspense fallback={<div />}>
                <ConfirmedCaseVisual />
              </React.Suspense>
            )}
            <Typography variant="h2">{t("epidemic.title")}</Typography>
            <BasicCard>
            {epidemicCurve(data.fullWarsCase)}
            </BasicCard>
            <Typography variant="h2">{t("dashboard.passenger")}</Typography>

            <Paragraph>{t("dashboard.reference_only")}</Paragraph>
            <Typography variant="body2">
              <Link
                href="https://www.immd.gov.hk/hkt/message_from_us/stat_menu.html"
                target="_blank"
              >
                {t("dashboard.source_immd")}
              </Link>
            </Typography>

            <Typography variant="body2" color="textPrimary">
              {`${t("dashboard.immd_remark", {
                to: data.allImmdAirport.edges[0].node.date,
                from: data.allImmdAirport.edges[1].node.date,
              })}`}
            </Typography>
            <BasicCard>
              <PassengerStats
                t={t}
                bridge={data.allImmdHongKongZhuhaiMacaoBridge.edges}
                airport={data.allImmdAirport.edges}
                total={data.allImmdTotal.edges}
                bay={data.allImmdShenzhenBay.edges}
              />
            </BasicCard>

            {!isMobile && (
              <Typography variant="h2">{t("index.highlight")}</Typography>
            )}
            {!isMobile && !isSSR() && (
              <React.Suspense fallback={<div />}>
                <ConfirmedCaseVisual />
              </React.Suspense>
            )}
          </SessionWrapper>
          <SessionWrapper>
            <OutboundAlert data={data.allBorderShutdown.edges} />
            <FriendlyLinksContainer>
              <Grid container spacing={1}>
                {data.allFriendlyLink.edges.map((item, index) => (
                  <Grid item xs={12} md={6} key={index}>
                    <FullWidthButton
                      index={index}
                      component={Link}
                      href={item.node.source_url}
                      target="_blank"
                      variant="outlined"
                    >
                      {item.node.title}
                    </FullWidthButton>
                  </Grid>
                ))}
              </Grid>
            </FriendlyLinksContainer>
            <Typography variant="h2">{t("index.latest_case")}</Typography>
            {latestCases.map((item, index) => (
              <WarsCaseCard
                key={index}
                node={item.node}
                showViewMore={true}
                i18n={i18n}
                t={t}
              />
            ))}
            <FullWidthButton
              component={InternalLink}
              to={getLocalizedPath(i18n, "/cases")}
              variant="outlined"
            >
              {t("index.see_more")}
            </FullWidthButton>
          </SessionWrapper>
        </SplitWrapper>
      </Layout>
    </>
  )
}

export const WarsCaseQuery = graphql`
  query($locale: String) {
    allImmdHongKongZhuhaiMacaoBridge(sort: { order: DESC, fields: date }) {
      edges {
        node {
          arrival_hong_kong
          arrival_mainland
          arrival_other
          arrival_total
          date
          departure_hong_kong
          departure_mainland
          departure_other
          departure_total
          location
        }
      }
    }
    allImmdTotal(sort: { order: DESC, fields: date }) {
      edges {
        node {
          arrival_hong_kong
          arrival_mainland
          arrival_other
          arrival_total
          date
          departure_hong_kong
          departure_mainland
          departure_other
          departure_total
          location
        }
      }
    }
    allImmdAirport(sort: { order: DESC, fields: date }) {
      edges {
        node {
          arrival_hong_kong
          arrival_mainland
          arrival_other
          arrival_total
          date
          departure_hong_kong
          departure_mainland
          departure_other
          departure_total
          location
        }
      }
    }
    allImmdShenzhenBay(sort: { order: DESC, fields: date }) {
      edges {
        node {
          arrival_hong_kong
          arrival_mainland
          arrival_other
          arrival_total
          date
          departure_hong_kong
          departure_mainland
          departure_other
          departure_total
          location
        }
      }
    }
    allBotWarsLatestFigures(sort: { order: DESC, fields: date }) {
      edges {
        node {
          date
          time
          confirmed
          ruled_out
          investigating
          reported
          death
          discharged
        }
      }
    }
    fullWarsCase: allWarsCase(
      sort: { order: DESC, fields: case_no }
      filter: { enabled: { eq: "Y" } }
    ) {
      edges {
        node {
          case_no
          onset_date
          confirmation_date
          gender
          age
          hospital_zh
          hospital_en
          status
          status_zh
          status_en
          type_zh
          type_en
          citizenship_zh
          citizenship_en
          detail_zh
          detail_en
          classification
          classification_zh
          classification_en
          source_url
        }
      }
    }

    allWarsLatestFiguresOverride(sort: { order: DESC, fields: date }) {
      edges {
        node {
          date
          confirmed
          death
          discharged
        }
      }
    }
    allWarsCase(
      sort: { order: [DESC, DESC], fields: [confirmation_date, case_no] }
      limit: 5
    ) {
      edges {
        node {
          case_no
          onset_date
          confirmation_date
          gender
          age
          hospital_zh
          hospital_en
          status
          type_zh
          type_en
          citizenship_zh
          citizenship_en
          detail_zh
          detail_en
          classification
          classification_zh
          classification_en
          source_url
        }
      }
    }
    allFriendlyLink(
      sort: { fields: sort_order, order: DESC }
      filter: { language: { eq: $locale } }
    ) {
      edges {
        node {
          language
          title
          source_url
          sort_order
        }
      }
    }
    allBorderShutdown(sort: { order: ASC, fields: [category, status_order] }) {
      edges {
        node {
          last_update
          iso_code
          category
          detail_zh
          detail_en
          status_zh
          status_en
          status_order
          source_url_zh
          source_url_en
        }
      }
    }
  }
`
